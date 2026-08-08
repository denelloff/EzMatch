'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';
import { getT } from '@/lib/i18n';

const schema = z.object({
  serverId: z.string().min(1),
  username: z.string().min(1).max(64),
  authMethod: z.enum(['password', 'key']),
  password: z.string().max(1024).optional(),
  privateKey: z.string().max(64 * 1024).optional(),
  passphrase: z.string().max(1024).optional(),
  expectedHostKey: z.string().max(256).optional(),
});

export interface ReinstallAgentState {
  error: string | null;
}

export async function reinstallAgentAction(
  _prev: ReinstallAgentState,
  formData: FormData,
): Promise<ReinstallAgentState> {
  let serverId: string;
  let taskId: string;

  try {
    const user = await assertRole('ADMIN');
    const t = await getT();

    const parsed = schema.safeParse({
      serverId: formData.get('serverId'),
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
    serverId = input.serverId;

    if (input.authMethod === 'password' && !input.password) {
      return { error: t.addServerPasswordRequired };
    }
    if (input.authMethod === 'key' && !input.privateKey) {
      return { error: t.addServerKeyRequired };
    }

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true, host: true, sshPort: true, name: true },
    });
    if (!server) {
      return { error: t.serverReinstallNotFound };
    }

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

    await audit(user, 'server.reinstall', 'server', server.id, {
      host: server.host,
      sshPort: server.sshPort,
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
      error: error instanceof Error ? error.message : t.serverReinstallFailed,
    };
  }

  redirect(`/admin/servers/${serverId}?task=${taskId}`);
}
