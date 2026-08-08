import type { Command, InstanceSnapshot, PluginSpec } from '@ppanel/protocol';
import type { AgentConfig } from './config.js';
import { listDemos } from './demos.js';
import { docker, dockerFacts } from './docker/client.js';
import type { InstanceManager } from './docker/instance.js';
import { collectHostInfo, freeBytesFor } from './host.js';
import type { LogServer } from './logs/server.js';
import { log } from './logger.js';
import { runInstallSteps, verifyPlugin, writeFakeRconPassword } from './plugins/installer.js';
import { scheduleAgentUpdate } from './self-update.js';

/** 20 GiB: a CS2 patch is far smaller than the game, but never trivial. */
const UPDATE_MIN_FREE_BYTES = 21_474_836_480;

function formatGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export interface CommandContext {
  config: AgentConfig;
  instances: InstanceManager;
  logs: LogServer;
  progress: (phase: string, message: string, percent: number | null) => void;
}

export async function executeCommand(
  command: Command,
  context: CommandContext,
): Promise<unknown> {
  switch (command.type) {
    case 'host.info': {
      const facts = await dockerFacts(true);
      return collectHostInfo({
        dockerVersion: facts.version,
        dockerRoot: facts.rootDir,
      });
    }

    case 'host.diskCheck': {
      const freeBytes = await freeBytesFor(command.path);
      return {
        path: command.path,
        freeBytes,
        sufficient: freeBytes >= command.minFreeBytes,
      };
    }

    case 'agent.update':
      return scheduleAgentUpdate({
        containerName: context.config.agentHost,
        image: command.image,
        progress: context.progress,
      });

    case 'instance.create': {
      const facts = await dockerFacts();
      const target = facts.rootDir ?? '/var/lib/docker';
      const freeBytes = await freeBytesFor(target);

      const result = await context.instances.create({
        instanceId: command.instanceId,
        config: command.config,
        ports: command.ports,
        minFreeBytes: command.minFreeBytes,
        freeBytes,
        report: context.progress,
      });

      if (command.plugins.length > 0) {
        await installPlugins(command.instanceId, command.plugins, context);
      }

      await applyLogSink(command.instanceId, 3, false, context);
      return result;
    }

    case 'instance.start':
      await context.instances.start(command.instanceId);
      return context.instances.snapshot(context.instances.get(command.instanceId));

    case 'instance.stop':
      await context.instances.stop(command.instanceId, command.timeoutSec);
      return context.instances.snapshot(context.instances.get(command.instanceId));

    case 'instance.restart':
      await context.instances.restart(command.instanceId);
      return context.instances.snapshot(context.instances.get(command.instanceId));

    case 'instance.remove':
      context.logs.unregister(command.instanceId);
      await context.instances.remove(command.instanceId, command.removeVolume, {
        containerName: command.containerName,
        volumeName: command.volumeName,
      });
      return { removed: true };

    case 'instance.update': {
      // SteamCMD stages an update alongside the existing files, so a patch can
      // need almost as much room as the install did. Running out halfway leaves
      // an unbootable game directory that only a reinstall fixes.
      const facts = await dockerFacts();
      const freeBytes = await freeBytesFor(facts.rootDir ?? '/var/lib/docker');
      if (freeBytes < UPDATE_MIN_FREE_BYTES) {
        throw new Error(
          `Not enough free disk for an update: ${formatGb(freeBytes)} available, ${formatGb(
            UPDATE_MIN_FREE_BYTES,
          )} recommended. Free up space before updating CS2.`,
        );
      }

      const result = await context.instances.update(
        command.instanceId,
        command.validate,
        context.progress,
      );
      await applyLogSink(command.instanceId, 3, false, context);
      return result;
    }

    case 'instance.inspect':
      return context.instances.inspect(command.instanceId);

    case 'instance.list':
      return context.instances.snapshots() satisfies InstanceSnapshot[];

    case 'instance.reconfigure':
      // Changing the CS2 config means changing container environment, which
      // requires recreating the container. Reported explicitly rather than
      // pretending it took effect.
      throw new Error(
        'Changing server settings requires recreating the container, which is not implemented yet. Remove the instance and create it again.',
      );

    case 'instance.setRestartPolicy': {
      const instance = context.instances.get(command.instanceId);
      instance.autoRestart = command.autoRestart;
      return { autoRestart: instance.autoRestart };
    }

    case 'console.attach': {
      const instance = context.instances.get(command.instanceId);
      await instance.console.start();
      return { attached: instance.console.isAttached };
    }

    case 'console.detach': {
      const instance = context.instances.get(command.instanceId);
      instance.console.stop();
      return { attached: false };
    }

    case 'console.send': {
      const instance = context.instances.get(command.instanceId);
      const output = await instance.console.sendAndCapture(
        command.commands.map((item) => ({
          command: item.command,
          delayMs: item.delayMs,
        })),
        command.captureMs,
      );
      return { output };
    }

    case 'plugin.install':
      await installPlugins(command.instanceId, [command.plugin], context);
      return { installed: command.plugin.id, version: command.plugin.version };

    case 'plugin.remove': {
      const instance = context.instances.get(command.instanceId);
      await runInstallSteps(
        instance.containerName,
        command.plugin.uninstall,
        (message, percent) => context.progress('installing-plugins', message, percent),
      );
      return { removed: command.plugin.id };
    }

    case 'plugin.list': {
      const instance = context.instances.get(command.instanceId);
      const output = await instance.console.sendAndCapture(
        [{ command: 'meta list', delayMs: 0 }],
        3000,
      );
      return { output };
    }

    case 'demo.list': {
      const instance = context.instances.get(command.instanceId);
      const files = await listDemos(docker.getContainer(instance.containerName));
      return { files };
    }

    case 'logsink.apply':
      return applyLogSink(
        command.instanceId,
        command.logDetail,
        command.logItems,
        context,
      );
  }
}

async function installPlugins(
  instanceId: string,
  plugins: PluginSpec[],
  context: CommandContext,
): Promise<void> {
  const instance = context.instances.get(instanceId);

  for (const plugin of plugins) {
    context.progress(
      'installing-plugins',
      `Installing ${plugin.id} ${plugin.version}`,
      null,
    );
    await runInstallSteps(instance.containerName, plugin.install, (message, percent) =>
      context.progress('installing-plugins', message, percent),
    );

    if (plugin.id === 'fake_rcon') {
      const password = await readContainerEnv(instance.containerName, 'CS2_RCONPW');
      if (!password) {
        throw new Error(
          'fake_rcon needs CS2_RCONPW from the container; set RCON password when creating the instance.',
        );
      }
      context.progress(
        'installing-plugins',
        'Writing fake_rcon password from rcon_password',
        null,
      );
      await writeFakeRconPassword(instance.containerName, password);
    }
  }

  // Plugins are loaded at map load, so nothing is verifiable until the server
  // has been through a restart.
  context.progress('installing-plugins', 'Restarting to load the plugins', null);
  await context.instances.restart(instanceId);

  for (const plugin of plugins) {
    if (!plugin.verifyCommand) continue;
    context.progress('verifying', `Checking ${plugin.id}`, null);

    const result = await verifyPlugin(plugin, (command, captureMs) =>
      instance.console.sendAndCapture([{ command, delayMs: 0 }], captureMs),
    );
    if (!result.ok) {
      throw new Error(
        `${plugin.id} ${plugin.version} did not load. \`${plugin.verifyCommand}\` returned: ${
          result.output.trim().slice(0, 500) || '(no output)'
        }. This usually means the pinned build does not match the current CS2 version.`,
      );
    }
    log.info('plugin verified', { instanceId, plugin: plugin.id });
  }
}

async function readContainerEnv(
  containerName: string,
  key: string,
): Promise<string | null> {
  const details = await docker.getContainer(containerName).inspect();
  const prefix = `${key}=`;
  for (const entry of details.Config.Env ?? []) {
    if (entry.startsWith(prefix)) return entry.slice(prefix.length);
  }
  return null;
}

/**
 * Points the server's log feed at this agent.
 *
 * `logaddress_delall_http` first: applying the same address twice makes CS2
 * send every line to it twice, and the call is idempotent from the panel's
 * point of view, so it may well run again after a restart.
 */
async function applyLogSink(
  instanceId: string,
  logDetail: number,
  logItems: boolean,
  context: CommandContext,
): Promise<{ url: string }> {
  const instance = context.instances.get(instanceId);
  const url = context.logs.register(
    instanceId,
    instance.secrets,
    context.config.agentHost,
  );

  await instance.console.sendAndCapture(
    [
      { command: 'logaddress_delall_http', delayMs: 100 },
      { command: `logaddress_add_http "${url}"`, delayMs: 100 },
      { command: `mp_logdetail ${logDetail}`, delayMs: 50 },
      { command: `mp_logdetail_items ${logItems ? 1 : 0}`, delayMs: 50 },
      { command: 'sv_logecho 1', delayMs: 50 },
      { command: 'log on', delayMs: 0 },
    ],
    0,
  );

  log.info('log sink applied', { instanceId });
  return { url };
}
