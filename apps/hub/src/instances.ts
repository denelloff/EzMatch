import { decryptSecret } from '@ppanel/db';
import type { Command, Cs2Config, PluginSpec } from '@ppanel/protocol';
import { isPluginId, PLUGIN_CATALOG, pluginName, resolvePluginOrder } from '@ppanel/protocol';
import { agents } from './agent/registry.js';
import type { HubConfig } from './config.js';
import { db } from './db.js';
import { logger } from './logger.js';
import { createTask, failTask, updateTask } from './tasks.js';

export class InstanceNotFoundError extends Error {}

/**
 * Rebuilds the plaintext CS2 config from the row. The panel stores the GSLT and
 * passwords encrypted and never sends them over the internal API, so this is
 * the single place they exist in the clear on the hub.
 */
export async function loadCs2Config(
  instanceId: string,
  masterKey: Buffer,
): Promise<{ config: Cs2Config; serverId: string }> {
  const instance = await db().gameInstance.findUnique({
    where: { id: instanceId },
  });
  if (!instance) throw new InstanceNotFoundError(instanceId);

  return {
    serverId: instance.serverId,
    config: {
      serverName: instance.serverTitle,
      gsltToken: decryptSecret(instance.gsltTokenEnc, masterKey),
      rconPassword: decryptSecret(instance.rconPasswordEnc, masterKey),
      joinPassword: instance.joinPasswordEnc
        ? decryptSecret(instance.joinPasswordEnc, masterKey)
        : '',
      maxPlayers: instance.maxPlayers,
      gameType: instance.gameType,
      gameMode: instance.gameMode,
      startMap: instance.startMap,
      lan: instance.lan,
      hibernate: instance.hibernate,
      extraArgs: instance.extraArgs,
    },
  };
}

export function pluginSpecsFor(ids: string[]): PluginSpec[] {
  return resolvePluginOrder(ids.filter(isPluginId)).map((id) => PLUGIN_CATALOG[id]);
}

/**
 * Runs an agent command as a tracked task. Returns as soon as the task exists
 * so the caller can hand the browser something to subscribe to; the command
 * itself may take hours.
 */
export async function runInstanceTask(input: {
  serverId: string;
  instanceId: string | null;
  type: string;
  command: Command;
  createdById?: string | null;
  onSuccess?: (result: unknown) => Promise<void>;
}): Promise<string> {
  const taskId = await createTask({
    serverId: input.serverId,
    instanceId: input.instanceId,
    type: input.type,
    createdById: input.createdById ?? null,
  });

  const connection = agents.get(input.serverId);
  if (!connection) {
    await failTask(
      taskId,
      new Error('The agent for this server is not connected'),
    );
    return taskId;
  }

  void updateTask(taskId, { status: 'RUNNING', phase: 'queued', message: 'Sent to the agent' });

  void connection
    .dispatch(input.command, taskId)
    .then(async (result) => {
      await input.onSuccess?.(result);
      await updateTask(taskId, {
        status: 'SUCCEEDED',
        phase: 'done',
        percent: 100,
        message: 'Completed',
        error: null,
        result,
      });
    })
    .catch(async (error: unknown) => {
      logger.error({ taskId, type: input.type, error }, 'instance task failed');
      await failTask(taskId, error);
    });

  return taskId;
}

/**
 * Installs a plugin together with everything it depends on, in dependency
 * order, under a single task. Metamod has to be in place and the container
 * restarted before CounterStrikeSharp will load, so these cannot be parallel.
 */
export async function installPluginTask(input: {
  serverId: string;
  instanceId: string;
  pluginId: string;
  createdById: string | null;
  buildId: string | null;
}): Promise<string> {
  const specs = pluginSpecsFor([input.pluginId]);
  if (specs.length === 0) throw new Error(`Unknown plugin ${input.pluginId}`);

  const taskId = await createTask({
    serverId: input.serverId,
    instanceId: input.instanceId,
    type: 'plugin.install',
    createdById: input.createdById,
  });

  const connection = agents.get(input.serverId);
  if (!connection) {
    await failTask(taskId, new Error('The agent for this server is not connected'));
    return taskId;
  }

  void (async () => {
    try {
      for (const [index, spec] of specs.entries()) {
        await updateTask(taskId, {
          status: 'RUNNING',
          phase: 'install',
          percent: Math.round((index / specs.length) * 100),
          message: `Installing ${pluginName(spec.id)} ${spec.version}`,
        });

        await connection.dispatch(
          { type: 'plugin.install', instanceId: input.instanceId, plugin: spec },
          taskId,
        );

        await db().pluginInstall.upsert({
          where: {
            instanceId_pluginId: { instanceId: input.instanceId, pluginId: spec.id },
          },
          create: {
            instanceId: input.instanceId,
            pluginId: spec.id,
            version: spec.version,
            status: 'INSTALLED',
            installedAt: new Date(),
          },
          update: {
            version: spec.version,
            status: 'INSTALLED',
            installedAt: new Date(),
            lastError: null,
          },
        });
      }

      await db().gameInstance.update({
        where: { id: input.instanceId },
        data: { pluginsOkBuildId: input.buildId },
      });

      await updateTask(taskId, {
        status: 'SUCCEEDED',
        phase: 'done',
        percent: 100,
        message: `Installed ${specs.map((spec) => pluginName(spec.id)).join(', ')}`,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db().pluginInstall.updateMany({
        where: { instanceId: input.instanceId, pluginId: input.pluginId },
        data: { status: 'FAILED', lastError: message },
      });
      logger.error({ taskId, pluginId: input.pluginId, error }, 'plugin install failed');
      await failTask(taskId, error);
    }
  })();

  return taskId;
}

export async function createInstanceTask(
  instanceId: string,
  config: HubConfig,
  createdById: string | null,
): Promise<string> {
  const instance = await db().gameInstance.findUnique({
    where: { id: instanceId },
    include: { plugins: true },
  });
  if (!instance) throw new InstanceNotFoundError(instanceId);

  const { config: cs2Config } = await loadCs2Config(instanceId, config.masterKey);
  const plugins = pluginSpecsFor(instance.plugins.map((plugin) => plugin.pluginId));

  return runInstanceTask({
    serverId: instance.serverId,
    instanceId,
    type: 'instance.create',
    createdById,
    command: {
      type: 'instance.create',
      instanceId,
      config: cs2Config,
      ports: { game: instance.gamePort, tv: instance.tvPort },
      plugins,
      minFreeBytes: config.agent.minFreeBytes,
    },
    onSuccess: async (result) => {
      const payload = result as {
        ports?: { game: number; tv: number };
        buildId?: string | null;
      } | null;

      await db().gameInstance.update({
        where: { id: instanceId },
        data: {
          state: 'RUNNING',
          ...(payload?.ports
            ? { gamePort: payload.ports.game, tvPort: payload.ports.tv }
            : {}),
          ...(payload?.buildId
            ? { buildId: payload.buildId, pluginsOkBuildId: payload.buildId }
            : {}),
          lastError: null,
        },
      });

      // The rows were created before the pinned versions were known, so they
      // are stamped here rather than left saying "pending" forever.
      for (const spec of plugins) {
        await db().pluginInstall.updateMany({
          where: { instanceId, pluginId: spec.id },
          data: {
            version: spec.version,
            status: 'INSTALLED',
            installedAt: new Date(),
            lastError: null,
          },
        });
      }
    },
  });
}
