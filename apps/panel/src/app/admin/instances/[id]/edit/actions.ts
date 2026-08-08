'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';
import { seal } from '@/lib/secrets';

const EXTRA_ARGS = /^[A-Za-z0-9 _.,:+/@=-]*$/;

const schema = z.object({
  instanceId: z.string().min(1).max(64),
  name: z.string().min(1).max(48),
  serverTitle: z.string().min(1).max(64),
  gsltToken: z.string().max(64).optional(),
  rconPassword: z.string().max(64).optional(),
  joinPassword: z.string().max(64).optional(),
  clearJoinPassword: z.boolean().default(false),
  maxPlayers: z.coerce.number().int().min(2).max(64),
  gameMode: z.coerce.number().int().min(0).max(2),
  startMap: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Map names are lowercase letters, digits and underscores'),
  vacDisabled: z.boolean().default(false),
  botsDisabled: z.boolean().default(true),
  extraArgs: z
    .string()
    .max(512)
    .regex(EXTRA_ARGS, 'Only plain -convar style arguments are allowed')
    .optional(),
});

export interface EditInstanceState {
  error: string | null;
}

export async function editInstanceAction(
  _prev: EditInstanceState,
  formData: FormData,
): Promise<EditInstanceState> {
  try {
    const user = await assertRole('ADMIN');

    const parsed = schema.safeParse({
      instanceId: formData.get('instanceId'),
      name: formData.get('name'),
      serverTitle: formData.get('serverTitle'),
      gsltToken: String(formData.get('gsltToken') ?? '').trim() || undefined,
      rconPassword: String(formData.get('rconPassword') ?? '').trim() || undefined,
      joinPassword: String(formData.get('joinPassword') ?? '').trim() || undefined,
      clearJoinPassword: formData.get('clearJoinPassword') === 'on',
      maxPlayers: formData.get('maxPlayers') || 10,
      gameMode: formData.get('gameMode') || 1,
      startMap: formData.get('startMap') || 'de_dust2',
      vacDisabled: formData.get('vacDisabled') === 'on',
      botsDisabled: formData.get('botsDisabled') === 'on',
      extraArgs: formData.get('extraArgs') || undefined,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const input = parsed.data;

    if (input.gsltToken !== undefined && input.gsltToken.length < 8) {
      return { error: 'GSLT token must be at least 8 characters, or leave blank to keep.' };
    }
    if (input.rconPassword !== undefined && input.rconPassword.length < 8) {
      return { error: 'RCON password must be at least 8 characters, or leave blank to keep.' };
    }

    const instance = await prisma.gameInstance.findUnique({
      where: { id: input.instanceId },
      select: { id: true, state: true },
    });
    if (!instance) return { error: 'Instance not found.' };
    if (instance.state === 'REMOVED' || instance.state === 'CREATING') {
      return { error: 'This instance cannot be edited in its current state.' };
    }

    await prisma.gameInstance.update({
      where: { id: input.instanceId },
      data: {
        name: input.name,
        serverTitle: input.serverTitle,
        maxPlayers: input.maxPlayers,
        gameMode: input.gameMode,
        startMap: input.startMap,
        vacDisabled: input.vacDisabled,
        botsDisabled: input.botsDisabled,
        extraArgs: input.extraArgs ?? '',
        ...(input.gsltToken ? { gsltTokenEnc: seal(input.gsltToken) } : {}),
        ...(input.rconPassword ? { rconPasswordEnc: seal(input.rconPassword) } : {}),
        ...(input.clearJoinPassword
          ? { joinPasswordEnc: '' }
          : input.joinPassword
            ? { joinPasswordEnc: seal(input.joinPassword) }
            : {}),
      },
    });

    const response = await hubFetch<{ taskId: string }>(
      `/internal/instances/${input.instanceId}/lifecycle`,
      {
        method: 'POST',
        body: {
          action: 'reconfigure',
          createdById: user.id,
        },
        timeoutMs: 60_000,
      },
    );

    await audit(user, 'instance.reconfigure', 'instance', input.instanceId, {
      botsDisabled: input.botsDisabled,
      vacDisabled: input.vacDisabled,
    });

    revalidatePath(`/admin/instances/${input.instanceId}`);
    redirect(`/admin/instances/${input.instanceId}?task=${response.taskId}`);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to edit this server.' };
    }
    if (error instanceof HubError) return { error: error.message };
    // Next.js redirect() throws; rethrow so navigation works.
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}
