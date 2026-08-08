'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Commands that change who can do what, or hand out shell-adjacent power on the
 * game host. Blocked from the console box so the panel's own roles stay
 * meaningful — an OPERATOR is not supposed to be able to promote themselves.
 */
const BLOCKED_COMMANDS = new Set([
  'rcon_password',
  'sv_rcon_whitelist_address',
  'exec',
  'quit',
  'exit',
  '_restart',
  'sv_downloadurl',
  'host_writeconfig',
  'logaddress_add_http',
  'logaddress_delall_http',
  'log',
]);

/** Only ADMIN may run these: they end or rewrite a match in progress. */
const ADMIN_ONLY_COMMANDS = new Set([
  'sv_cheats',
  'mp_backup_restore_load_file',
  'changelevel',
  'map',
  'kickid',
  'banid',
  'sv_password',
]);

const consoleSchema = z.object({
  instanceId: z.string().min(1).max(64),
  command: z.string().min(1).max(512),
});

export interface ConsoleResult {
  ok: boolean;
  error: string | null;
  output: string[];
}

export async function sendConsoleAction(
  input: z.infer<typeof consoleSchema>,
): Promise<ConsoleResult> {
  try {
    const user = await assertRole('OPERATOR');
    const parsed = consoleSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: 'Invalid command', output: [] };
    }

    // Each command holds the agent's single console attachment for its capture
    // window, so a stuck key or a hijacked session cannot be allowed to flood it.
    const limit = rateLimit(`console:${user.id}`, 30, 10_000);
    if (!limit.allowed) {
      return {
        ok: false,
        error: `Too many commands. Try again in ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
        output: [],
      };
    }

    const command = parsed.data.command.trim();
    // Two commands on one line would let a blocked verb ride along behind an
    // allowed one.
    if (/[\n\r;]/.test(command)) {
      return { ok: false, error: 'One command per line.', output: [] };
    }

    const verb = command.split(/\s+/)[0]!.toLowerCase();
    if (BLOCKED_COMMANDS.has(verb)) {
      return {
        ok: false,
        error: `${verb} is not available from the panel console.`,
        output: [],
      };
    }
    if (ADMIN_ONLY_COMMANDS.has(verb) && user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return { ok: false, error: `${verb} requires an admin.`, output: [] };
    }

    const instance = await prisma.gameInstance.findUnique({
      where: { id: parsed.data.instanceId },
      select: { id: true, state: true },
    });
    if (!instance) return { ok: false, error: 'Instance not found', output: [] };
    if (instance.state !== 'RUNNING') {
      return { ok: false, error: 'The server is not running.', output: [] };
    }

    const response = await hubFetch<{ result?: { output?: string[] } }>(
      `/internal/instances/${instance.id}/console`,
      {
        method: 'POST',
        body: { commands: [command], captureMs: 700 },
        timeoutMs: 15_000,
      },
    );

    await audit(user, 'console.send', 'instance', instance.id, { command: verb });

    return { ok: true, error: null, output: response.result?.output ?? [] };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, error: 'You may not send console commands.', output: [] };
    }
    if (error instanceof HubError) {
      return { ok: false, error: error.message, output: [] };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
      output: [],
    };
  }
}

const lifecycleSchema = z.object({
  instanceId: z.string().min(1).max(64),
  action: z.enum(['start', 'stop', 'restart', 'update', 'remove']),
  removeVolume: z.boolean().optional(),
});

export interface LifecycleState {
  error: string | null;
  taskId: string | null;
}

export async function instanceLifecycleAction(
  _prev: LifecycleState,
  formData: FormData,
): Promise<LifecycleState> {
  try {
    // Removing destroys the instance and updating can break the plugins the
    // next match depends on; starting and stopping are routine.
    const requested = String(formData.get('action') ?? '');
    const user = await assertRole(
      requested === 'remove' || requested === 'update' ? 'ADMIN' : 'OPERATOR',
    );

    const parsed = lifecycleSchema.safeParse({
      instanceId: formData.get('instanceId'),
      action: formData.get('action'),
      removeVolume: formData.get('removeVolume') === 'on',
    });
    if (!parsed.success) return { error: 'Invalid request', taskId: null };
    const input = parsed.data;

    const response = await hubFetch<{ taskId: string }>(
      `/internal/instances/${input.instanceId}/lifecycle`,
      {
        method: 'POST',
        body: {
          action: input.action,
          createdById: user.id,
          ...(input.action === 'remove'
            ? { removeVolume: input.removeVolume ?? false }
            : {}),
        },
      },
    );

    await audit(user, `instance.${input.action}`, 'instance', input.instanceId, {
      removeVolume: input.removeVolume ?? false,
    });

    revalidatePath(`/admin/instances/${input.instanceId}`);
    return { error: null, taskId: response.taskId };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission for this action.', taskId: null };
    }
    if (error instanceof HubError) return { error: error.message, taskId: null };
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      taskId: null,
    };
  }
}

const pluginSchema = z.object({
  instanceId: z.string().min(1).max(64),
  pluginId: z.string().min(1).max(64).optional(),
  action: z.enum(['install', 'remove', 'remove-all', 'check-updates']),
});

export type PluginActionState = {
  error: string | null;
  taskId: string | null;
  message: string | null;
  title: string | null;
};

export async function pluginAction(
  _prev: PluginActionState,
  formData: FormData,
): Promise<PluginActionState> {
  try {
    const user = await assertRole('ADMIN');

    const parsed = pluginSchema.safeParse({
      instanceId: formData.get('instanceId'),
      pluginId: formData.get('pluginId') || undefined,
      action: formData.get('action'),
    });
    if (!parsed.success) {
      return { error: 'Invalid request', taskId: null, message: null, title: null };
    }
    const input = parsed.data;

    if (
      (input.action === 'install' || input.action === 'remove') &&
      !input.pluginId
    ) {
      return { error: 'Invalid request', taskId: null, message: null, title: null };
    }

    if (input.action === 'check-updates') {
      const result = await hubFetch<{
        updates: Array<{
          name: string;
          installedVersion: string;
          catalogVersion: string;
        }>;
        upToDate: Array<{ name: string; installedVersion: string }>;
      }>(`/internal/instances/${input.instanceId}/plugins`, {
        method: 'POST',
        body: {
          action: 'check-updates',
          createdById: user.id,
        },
      });

      await audit(user, 'plugin.check-updates', 'instance', input.instanceId, {
        updates: result.updates.length,
      });
      revalidatePath(`/admin/instances/${input.instanceId}`);

      if (result.updates.length === 0) {
        const count = result.upToDate.length;
        return {
          error: null,
          taskId: null,
          title: null,
          message:
            count === 0
              ? 'No plugins installed.'
              : `All ${count} installed plugin(s) match the catalog.`,
        };
      }

      const lines = result.updates.map(
        (item) =>
          `${item.name}: ${item.installedVersion} → ${item.catalogVersion}`,
      );
      return {
        error: null,
        taskId: null,
        title: null,
        message: `Updates available:\n${lines.join('\n')}\nReinstall a plugin to apply its catalog version.`,
      };
    }

    const response = await hubFetch<{ taskId: string }>(
      `/internal/instances/${input.instanceId}/plugins`,
      {
        method: 'POST',
        body: {
          ...(input.pluginId ? { pluginId: input.pluginId } : {}),
          action: input.action,
          createdById: user.id,
        },
      },
    );

    await audit(user, `plugin.${input.action}`, 'instance', input.instanceId, {
      ...(input.pluginId ? { pluginId: input.pluginId } : {}),
    });

    revalidatePath(`/admin/instances/${input.instanceId}`);
    const title =
      input.action === 'remove-all'
        ? 'Removing plugins'
        : input.action === 'remove'
          ? 'Removing plugin'
          : 'Installing plugins';
    return { error: null, taskId: response.taskId, message: null, title };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        error: 'You do not have permission to manage plugins.',
        taskId: null,
        message: null,
        title: null,
      };
    }
    if (error instanceof HubError) {
      return { error: error.message, taskId: null, message: null, title: null };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      taskId: null,
      message: null,
      title: null,
    };
  }
}

export async function deleteInstanceRowAction(instanceId: string): Promise<void> {
  const user = await assertRole('ADMIN');
  const instance = await prisma.gameInstance.findUnique({
    where: { id: instanceId },
    select: { serverId: true, state: true },
  });
  if (!instance) return;
  if (instance.state !== 'REMOVED') {
    throw new Error('Remove the container first.');
  }

  await prisma.gameInstance.delete({ where: { id: instanceId } });
  await audit(user, 'instance.forget', 'instance', instanceId, {});
  redirect(`/admin/servers/${instance.serverId}`);
}
