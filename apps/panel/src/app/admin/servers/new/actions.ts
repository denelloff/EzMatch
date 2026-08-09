'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';
import { getT } from '@/lib/i18n';

const schema = z.object({
  name: z.string().min(1).max(64),
  host: z.string().min(1).max(255),
  sshPort: z.coerce.number().int().min(1).max(65535).default(22),
  region: z.string().max(32).optional(),
  username: z.string().min(1).max(64),
  authMethod: z.enum(['password', 'key']),
  password: z.string().max(1024).optional(),
  privateKey: z.string().max(64 * 1024).optional(),
  passphrase: z.string().max(1024).optional(),
  expectedHostKey: z.string().max(256).optional(),
});

export interface AddServerState {
  error: string | null;
}

export async function addServerAction(
  _prev: AddServerState,
  formData: FormData,
): Promise<AddServerState> {
  let serverId: string;
  let taskId: string;

  try {
    const user = await assertRole('ADMIN');

    const t = await getT();

    const parsed = schema.safeParse({
      name: formData.get('name'),
      host: formData.get('host'),
      sshPort: formData.get('sshPort') || 22,
      region: formData.get('region') || undefined,
      username: formData.get('username'),
      authMethod: formData.get('authMethod'),
      password: formData.get('password') || undefined,
      privateKey: formData.get('privateKey') || undefined,
      passphrase: formData.get('passphrase') || undefined,
      expectedHostKey: formData.get('expectedHostKey') || undefined,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const input = parsed.data;

    if (input.authMethod === 'password' && !input.password) {
      return { error: t.addServerPasswordRequired };
    }
    if (input.authMethod === 'key' && !input.privateKey) {
      return { error: t.addServerKeyRequired };
    }

    const existing = await prisma.server.findFirst({
      where: { host: input.host, sshPort: input.sshPort },
    });
    if (existing) {
      return {
        error: t.addServerAlreadyRegistered
          .replace('{host}', `${input.host}:${input.sshPort}`)
          .replace('{name}', existing.name),
      };
    }

    const server = await prisma.server.create({
      data: {
        name: input.name,
        host: input.host,
        sshPort: input.sshPort,
        region: input.region ?? null,
      },
    });
    serverId = server.id;

    // The credentials are forwarded to the hub and never written anywhere.
    // After this call the only thing linking the panel to the host is the agent
    // token, of which the panel keeps a hash.
    try {
      const response = await hubFetch<{ taskId: string }>(
        `/internal/servers/${server.id}/bootstrap`,
        {
          method: 'POST',
          body: {
            username: input.username,
            ...(input.authMethod === 'password'
              ? { password: input.password }
              : { privateKey: input.privateKey, passphrase: input.passphrase }),
            ...(input.expectedHostKey
              ? { expectedHostKey: input.expectedHostKey }
              : {}),
            createdById: user.id,
          },
        },
      );
      taskId = response.taskId;
    } catch (error) {
      // The row only exists to give the bootstrap a server id. If the hub never
      // accepted the job, leaving it behind would show a server that was never
      // contacted and block the host from being registered again.
      await prisma.server.delete({ where: { id: server.id } }).catch(() => undefined);
      throw error;
    }

    await audit(user, 'server.bootstrap', 'server', server.id, {
      host: input.host,
      sshPort: input.sshPort,
      authMethod: input.authMethod,
    });
  } catch (error) {
    const t = await getT();
    if (error instanceof ForbiddenError) {
      return { error: t.addServerForbidden };
    }
    if (error instanceof HubError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : t.addServerUnexpected,
    };
  }

  redirect(`/admin/servers/${serverId}?task=${taskId}`);
}

