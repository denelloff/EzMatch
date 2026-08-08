import { z } from 'zod';
import { isPluginId, PLUGIN_DESCRIPTIONS } from '@ppanel/protocol';
import type { HubApp } from '../app.js';
import { agents, AgentOfflineError } from '../agent/registry.js';
import type { HubConfig } from '../config.js';
import { db } from '../db.js';
import {
  createInstanceTask,
  installPluginTask,
  InstanceNotFoundError,
  loadCs2Config,
  pluginSpecsFor,
  runInstanceTask,
} from '../instances.js';

const createBody = z.object({
  createdById: z.string().max(64).nullable().optional(),
});

const lifecycleBody = z.object({
  action: z.enum(['start', 'stop', 'restart', 'remove', 'update', 'reconfigure']),
  createdById: z.string().max(64).nullable().optional(),
  removeVolume: z.boolean().optional(),
  validate: z.boolean().optional(),
});

const consoleBody = z.object({
  commands: z
    .array(
      z.union([
        z.string().min(1).max(1024),
        z.object({
          command: z.string().min(1).max(1024),
          delayMs: z.number().int().min(0).max(60_000).optional(),
        }),
      ]),
    )
    .min(1)
    .max(64),
  captureMs: z.number().int().min(0).max(30_000).optional(),
});

const pluginBody = z.object({
  pluginId: z.string().min(1).max(64),
  action: z.enum(['install', 'remove']),
  createdById: z.string().max(64).nullable().optional(),
});

export function registerInstanceRoutes(app: HubApp, config: HubConfig): void {
  app.post<{ Params: { instanceId: string } }>(
    '/internal/instances/:instanceId/create',
    async (request, reply) => {
      const parsed = createBody.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: parsed.error.issues });
      }

      try {
        const taskId = await createInstanceTask(
          request.params.instanceId,
          config,
          parsed.data.createdById ?? null,
        );
        return reply.send({ taskId });
      } catch (error) {
        if (error instanceof InstanceNotFoundError) {
          return reply.code(404).send({ error: 'not_found' });
        }
        throw error;
      }
    },
  );

  app.post<{ Params: { instanceId: string } }>(
    '/internal/instances/:instanceId/lifecycle',
    async (request, reply) => {
      const parsed = lifecycleBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: parsed.error.issues });
      }
      const body = parsed.data;
      const { instanceId } = request.params;

      const instance = await db().gameInstance.findUnique({ where: { id: instanceId } });
      if (!instance) return reply.code(404).send({ error: 'not_found' });

      const command = await buildLifecycleCommand(body, instanceId, config);

      // The optimistic state makes the UI show "stopping"/"starting" straight
      // away; the agent's own snapshot corrects it either way when it lands.
      const optimistic = {
        start: 'STARTING',
        stop: 'STOPPING',
        restart: 'STARTING',
        update: 'UPDATING',
        remove: 'STOPPING',
        reconfigure: 'STARTING',
      } as const;
      await db().gameInstance.update({
        where: { id: instanceId },
        data: { state: optimistic[body.action] },
      });

      const taskId = await runInstanceTask({
        serverId: instance.serverId,
        instanceId,
        type: `instance.${body.action}`,
        createdById: body.createdById ?? null,
        command,
        onSuccess: async (result) => {
          if (body.action === 'remove') {
            await db().gameInstance.update({
              where: { id: instanceId },
              data: { state: 'REMOVED', containerId: null },
            });
            return;
          }

          const payload = result as { buildId?: string | null } | null;
          await db().gameInstance.update({
            where: { id: instanceId },
            data: {
              state: body.action === 'stop' ? 'STOPPED' : 'RUNNING',
              lastError: null,
              ...(payload?.buildId ? { buildId: payload.buildId } : {}),
            },
          });
        },
      });

      return reply.send({ taskId });
    },
  );

  app.post<{ Params: { instanceId: string } }>(
    '/internal/instances/:instanceId/console',
    async (request, reply) => {
      const parsed = consoleBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: parsed.error.issues });
      }
      const { instanceId } = request.params;

      const instance = await db().gameInstance.findUnique({ where: { id: instanceId } });
      if (!instance) return reply.code(404).send({ error: 'not_found' });

      const commands = parsed.data.commands.map((entry) =>
        typeof entry === 'string'
          ? { command: entry, delayMs: 0 }
          : { command: entry.command, delayMs: entry.delayMs ?? 0 },
      );

      // Console commands are interactive: the caller waits for the reply rather
      // than following a task, so failures come back as HTTP errors.
      try {
        const result = await agents.dispatch(instance.serverId, {
          type: 'console.send',
          instanceId,
          commands,
          captureMs: parsed.data.captureMs ?? 0,
        });
        return reply.send({ ok: true, result });
      } catch (error) {
        if (error instanceof AgentOfflineError) {
          return reply.code(503).send({ error: 'agent_offline', detail: error.message });
        }
        const message = error instanceof Error ? error.message : String(error);
        return reply.code(502).send({ error: 'command_failed', detail: message });
      }
    },
  );

  app.post<{ Params: { instanceId: string } }>(
    '/internal/instances/:instanceId/plugins',
    async (request, reply) => {
      const parsed = pluginBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: parsed.error.issues });
      }
      const body = parsed.data;
      const { instanceId } = request.params;

      const instance = await db().gameInstance.findUnique({ where: { id: instanceId } });
      if (!instance) return reply.code(404).send({ error: 'not_found' });

      if (!isPluginId(body.pluginId)) {
        return reply.code(400).send({ error: 'unknown_plugin' });
      }

      if (body.action === 'install') {
        const taskId = await installPluginTask({
          serverId: instance.serverId,
          instanceId,
          pluginId: body.pluginId,
          createdById: body.createdById ?? null,
          buildId: instance.buildId,
        });
        return reply.send({ taskId });
      }

      // Removal touches only the requested plugin: whatever it depends on may
      // still be carrying another plugin.
      const [spec] = pluginSpecsFor([body.pluginId]).filter(
        (candidate) => candidate.id === body.pluginId,
      );
      if (!spec) return reply.code(400).send({ error: 'unknown_plugin' });

      const taskId = await runInstanceTask({
        serverId: instance.serverId,
        instanceId,
        type: 'plugin.remove',
        createdById: body.createdById ?? null,
        command: { type: 'plugin.remove', instanceId, plugin: spec },
        onSuccess: async () => {
          await db().pluginInstall.updateMany({
            where: { instanceId, pluginId: body.pluginId },
            data: { status: 'REMOVED', lastError: null },
          });
        },
      });

      return reply.send({ taskId });
    },
  );

  app.get('/internal/plugins', async () => ({ plugins: PLUGIN_DESCRIPTIONS }));

  /**
   * Force-delete an instance: ask the agent to scrub Docker artefacts, then
   * drop the panel row even if the agent had nothing to clean (failed create).
   */
  app.post<{ Params: { instanceId: string } }>(
    '/internal/instances/:instanceId/purge',
    async (request, reply) => {
      const body = z
        .object({
          removeVolume: z.boolean().optional(),
          createdById: z.string().max(64).nullable().optional(),
        })
        .safeParse(request.body ?? {});
      if (!body.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: body.error.issues });
      }

      const { instanceId } = request.params;
      const instance = await db().gameInstance.findUnique({ where: { id: instanceId } });
      if (!instance) return reply.code(404).send({ error: 'not_found' });

      const removeVolume = body.data.removeVolume ?? true;
      let agentError: string | null = null;

      try {
        await agents.dispatch(instance.serverId, {
          type: 'instance.remove',
          instanceId,
          removeVolume,
          containerName: instance.containerName,
          volumeName: instance.volumeName,
        });
      } catch (error) {
        agentError =
          error instanceof AgentOfflineError
            ? error.message
            : error instanceof Error
              ? error.message
              : String(error);
      }

      await purgeInstanceRow(instanceId);

      return reply.send({
        ok: true,
        serverId: instance.serverId,
        agentCleaned: agentError == null,
        agentError,
      });
    },
  );
}

async function removeNames(
  instanceId: string,
): Promise<{ containerName?: string; volumeName?: string }> {
  const instance = await db().gameInstance.findUnique({
    where: { id: instanceId },
    select: { containerName: true, volumeName: true },
  });
  if (!instance) return {};
  return {
    containerName: instance.containerName,
    volumeName: instance.volumeName,
  };
}

async function purgeInstanceRow(instanceId: string): Promise<void> {
  const matches = await db().match.findMany({
    where: { instanceId },
    select: { id: true },
  });
  const matchIds = matches.map((row) => row.id);

  if (matchIds.length > 0) {
    await db().matchDemo.deleteMany({ where: { matchId: { in: matchIds } } });
    await db().matchTransition.deleteMany({ where: { matchId: { in: matchIds } } });
    await db().matchPlayer.deleteMany({ where: { matchId: { in: matchIds } } });
    await db().gameEvent.updateMany({
      where: { matchId: { in: matchIds } },
      data: { matchId: null },
    });
    await db().match.deleteMany({ where: { id: { in: matchIds } } });
  }

  await db().gameEvent.deleteMany({ where: { instanceId } });
  await db().consoleLine.deleteMany({ where: { instanceId } });
  await db().pluginInstall.deleteMany({ where: { instanceId } });
  await db().task.updateMany({
    where: { instanceId },
    data: { instanceId: null },
  });
  await db().gameInstance.delete({ where: { id: instanceId } });
}

async function buildLifecycleCommand(
  body: z.infer<typeof lifecycleBody>,
  instanceId: string,
  config: HubConfig,
) {
  switch (body.action) {
    case 'start':
      return { type: 'instance.start', instanceId } as const;
    case 'stop':
      return { type: 'instance.stop', instanceId, timeoutSec: 30 } as const;
    case 'restart':
      return { type: 'instance.restart', instanceId } as const;
    case 'remove':
      return {
        type: 'instance.remove',
        instanceId,
        removeVolume: body.removeVolume ?? false,
        ...(await removeNames(instanceId)),
      } as const;
    case 'update':
      return {
        type: 'instance.update',
        instanceId,
        validate: body.validate ?? false,
      } as const;
    case 'reconfigure': {
      const { config: cs2Config } = await loadCs2Config(instanceId, config.masterKey);
      return { type: 'instance.reconfigure', instanceId, config: cs2Config } as const;
    }
  }
}
