'use server';

import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isPluginId, resolvePluginOrder } from '@ppanel/protocol';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';
import { generatePassword, seal } from '@/lib/secrets';

const FIRST_GAME_PORT = 27015;
const FIRST_TV_PORT = 27020;

/**
 * `extraArgs` lands on the cs2 command line, so anything that could end the
 * current argument and start a shell construct is refused outright rather than
 * escaped. Convar flags are what this field is for.
 */
const EXTRA_ARGS = /^[A-Za-z0-9 _.,:+/@=-]*$/;

const schema = z.object({
  name: z.string().min(1).max(48),
  serverTitle: z.string().min(1).max(64),
  gsltToken: z.string().min(8).max(64),
  joinPassword: z.string().max(64).optional(),
  maxPlayers: z.coerce.number().int().min(2).max(64),
  gameMode: z.coerce.number().int().min(0).max(2),
  startMap: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Map names are lowercase letters, digits and underscores'),
  extraArgs: z
    .string()
    .max(512)
    .regex(EXTRA_ARGS, 'Only plain -convar style arguments are allowed')
    .optional(),
  plugins: z.array(z.string()).default([]),
});

export interface NewInstanceState {
  error: string | null;
}

export async function createInstanceAction(
  _prev: NewInstanceState,
  formData: FormData,
): Promise<NewInstanceState> {
  let serverId: string;
  let taskId: string;

  try {
    const user = await assertRole('ADMIN');

    serverId = String(formData.get('serverId') ?? '');
    const parsed = schema.safeParse({
      name: formData.get('name'),
      serverTitle: formData.get('serverTitle'),
      gsltToken: formData.get('gsltToken'),
      joinPassword: formData.get('joinPassword') || undefined,
      maxPlayers: formData.get('maxPlayers') || 10,
      gameMode: formData.get('gameMode') || 1,
      startMap: formData.get('startMap') || 'de_dust2',
      extraArgs: formData.get('extraArgs') || undefined,
      plugins: formData.getAll('plugins').map(String),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const input = parsed.data;

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { instances: { where: { state: { not: 'REMOVED' } } } },
    });
    if (!server) return { error: 'Server not found.' };
    if (server.status !== 'ONLINE') {
      return {
        error:
          'The agent is not online yet. Finish agent deploy first, then install CS2.',
      };
    }

    // One instance per host until game files are shared between containers:
    // each install is roughly 60 GB of its own.
    if (server.instances.length > 0) {
      return {
        error:
          'This host already has a CS2 instance. Each one needs its own ~60 GB copy of the game, so add another host instead.',
      };
    }

    const usedGamePorts = new Set(server.instances.map((entry) => entry.gamePort));
    const gamePort = nextFreePort(FIRST_GAME_PORT, usedGamePorts);
    const tvPort = nextFreePort(
      FIRST_TV_PORT,
      new Set(server.instances.map((entry) => entry.tvPort)),
    );

    const suffix = randomBytes(4).toString('hex');
    const plugins = resolvePluginOrder(input.plugins.filter(isPluginId));

    const instance = await prisma.gameInstance.create({
      data: {
        serverId: server.id,
        name: input.name,
        containerName: `ppanel-cs2-${suffix}`,
        volumeName: `ppanel-cs2-${suffix}-data`,
        gamePort,
        tvPort,
        state: 'CREATING',
        gsltTokenEnc: seal(input.gsltToken),
        // Generated rather than asked for: nothing outside the agent needs it,
        // and a human-chosen RCON password on a public port is a liability.
        rconPasswordEnc: seal(generatePassword()),
        joinPasswordEnc: input.joinPassword ? seal(input.joinPassword) : '',
        serverTitle: input.serverTitle,
        maxPlayers: input.maxPlayers,
        gameType: 0,
        gameMode: input.gameMode,
        startMap: input.startMap,
        extraArgs: input.extraArgs ?? '',
        plugins: {
          create: plugins.map((pluginId) => ({
            pluginId,
            version: 'pending',
            status: 'PENDING' as const,
          })),
        },
      },
    });

    try {
      const response = await hubFetch<{ taskId: string }>(
        `/internal/instances/${instance.id}/create`,
        { method: 'POST', body: { createdById: user.id }, timeoutMs: 60_000 },
      );
      taskId = response.taskId;
    } catch (error) {
      await prisma.gameInstance
        .delete({ where: { id: instance.id } })
        .catch(() => undefined);
      throw error;
    }

    await audit(user, 'instance.create', 'instance', instance.id, {
      serverId: server.id,
      name: input.name,
      gamePort,
      plugins,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to install servers.' };
    }
    if (error instanceof HubError) return { error: error.message };
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }

  redirect(`/admin/servers/${serverId}?task=${taskId}`);
}

function nextFreePort(start: number, used: Set<number>): number {
  let port = start;
  while (used.has(port)) port += 1;
  return port;
}
