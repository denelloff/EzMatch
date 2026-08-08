import type { Command, InstanceSnapshot, PluginSpec } from '@ppanel/protocol';
import type { AgentConfig } from './config.js';
import { listDemos } from './demos.js';
import { readTextFile } from './docker/archive.js';
import { docker, dockerFacts } from './docker/client.js';
import type { InstanceManager } from './docker/instance.js';
import { resolveInstallPath } from './docker/paths.js';
import { collectHostInfo, freeBytesFor } from './host.js';
import type { LogServer } from './logs/server.js';
import { log } from './logger.js';
import { throwIfAborted, sleep } from './cancel.js';
import {
  fixAddonPermissions,
  runInstallSteps,
  verifyPlugin,
  writeFakeRconPassword,
} from './plugins/installer.js';
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
  signal?: AbortSignal;
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
      await enforceNoBotsIfConfigured(command.instanceId, context);
      return result;
    }

    case 'instance.start': {
      const startInstance = context.instances.get(command.instanceId);
      try {
        await fixAddonPermissions(startInstance.containerName);
      } catch (error) {
        log.warn('could not fix addon permissions before start', {
          instanceId: command.instanceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      await context.instances.start(command.instanceId);
      await applyLogSink(command.instanceId, 3, false, context);
      await enforceNoBotsIfConfigured(command.instanceId, context);
      return context.instances.snapshot(context.instances.get(command.instanceId));
    }

    case 'instance.stop':
      await context.instances.stop(command.instanceId, command.timeoutSec);
      return context.instances.snapshot(context.instances.get(command.instanceId));

    case 'instance.restart': {
      const restartInstance = context.instances.get(command.instanceId);
      try {
        await fixAddonPermissions(restartInstance.containerName);
      } catch (error) {
        log.warn('could not fix addon permissions before restart', {
          instanceId: command.instanceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      await context.instances.restart(command.instanceId);
      await applyLogSink(command.instanceId, 3, false, context);
      await enforceNoBotsIfConfigured(command.instanceId, context);
      return context.instances.snapshot(context.instances.get(command.instanceId));
    }

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

    case 'instance.reconfigure': {
      await context.instances.reconfigure(
        command.instanceId,
        command.config,
        context.progress,
      );
      const instance = context.instances.get(command.instanceId);
      try {
        const vdf = await readTextFile(
          docker.getContainer(instance.containerName),
          resolveInstallPath('game/csgo/addons/metamod/fake_rcon.vdf'),
        );
        if (vdf) {
          await writeFakeRconPassword(
            instance.containerName,
            command.config.rconPassword,
          );
        }
      } catch (error) {
        log.warn('fake_rcon password refresh skipped', { error });
      }
      await applyLogSink(command.instanceId, 3, false, context);
      if (command.config.botsDisabled) {
        await instance.console.sendAndCapture(
          [
            { command: 'bot_quota 0', delayMs: 200 },
            { command: 'bot_kick', delayMs: 0 },
          ],
          500,
        );
      }
      return { reconfigured: true };
    }

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
        context.signal,
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
    throwIfAborted(context.signal);
    context.progress(
      'installing-plugins',
      `Installing ${plugin.id} ${plugin.version}`,
      null,
    );
    await runInstallSteps(
      instance.containerName,
      plugin.install,
      (message, percent) => context.progress('installing-plugins', message, percent),
      context.signal,
    );

    if (plugin.id === 'fake_rcon') {
      throwIfAborted(context.signal);
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
      await fixAddonPermissions(instance.containerName);
    }
  }

  // Plugins are loaded at map load, so nothing is verifiable until the server
  // has been through a restart.
  throwIfAborted(context.signal);
  try {
    await fixAddonPermissions(instance.containerName);
  } catch (error) {
    log.warn('could not fix addon permissions before plugin restart', {
      instanceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  context.progress('installing-plugins', 'Restarting to load the plugins', null);
  await context.instances.restart(instanceId);

  // CS2 + Metamod need wall-clock time after start before console answers.
  context.progress('verifying', 'Waiting for server console after restart', null);
  await waitForConsoleReady(instance, 180_000, context.signal);

  for (const plugin of plugins) {
    if (!plugin.verifyCommand) continue;
    throwIfAborted(context.signal);
    context.progress('verifying', `Checking ${plugin.id}`, null);

    const result = await verifyPluginWithRetry(
      plugin,
      (command, captureMs) =>
        instance.console.sendAndCapture([{ command, delayMs: 0 }], captureMs),
      180_000,
      (msg) => context.progress('verifying', msg, null),
      context.signal,
      () => instance.console.isContainerRunning(),
      () => instance.console.start(),
    );
    if (!result.ok) {
      throw new Error(formatVerifyFailure(plugin, result.output));
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

/** If CS2_BOT_QUOTA is 0, push bot_quota/bot_kick so fill bots do not stay. */
async function enforceNoBotsIfConfigured(
  instanceId: string,
  context: CommandContext,
): Promise<void> {
  const instance = context.instances.get(instanceId);
  const quota = await readContainerEnv(instance.containerName, 'CS2_BOT_QUOTA');
  if (quota !== '0') return;
  try {
    await instance.console.sendAndCapture(
      [
        { command: 'bot_quota 0', delayMs: 200 },
        { command: 'bot_kick', delayMs: 0 },
      ],
      500,
    );
  } catch (error) {
    log.warn('bot_kick after start skipped', { instanceId, error });
  }
}

async function waitForConsoleReady(
  instance: {
    console: {
      start: () => Promise<void>;
      isAttached: boolean;
      isContainerRunning: () => Promise<boolean>;
    };
  },
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    throwIfAborted(signal);
    const running = await instance.console.isContainerRunning();
    if (!running) {
      await sleep(2_000, signal);
      continue;
    }

    await instance.console.start();
    if (!instance.console.isAttached) {
      await sleep(1_000, signal);
      continue;
    }

    // Extra settle time so CS2 finishes early boot before we spam meta commands.
    // Re-check afterwards: CSS/Metamod crash loops often die during this window.
    await sleep(12_000, signal);
    if (
      (await instance.console.isContainerRunning()) &&
      instance.console.isAttached
    ) {
      return;
    }
  }
  throw new Error(
    'CS2 did not stay up long enough to verify plugins. Check the console for a crash loop (often CounterStrikeSharp permissions or a bad Metamod build), then Start the instance and retry.',
  );
}

async function verifyPluginWithRetry(
  plugin: PluginSpec,
  runConsole: (command: string, captureMs: number) => Promise<string[]>,
  timeoutMs: number,
  onProgress: (message: string) => void,
  signal?: AbortSignal,
  isContainerRunning?: () => Promise<boolean>,
  startConsole?: () => Promise<void>,
): Promise<{ ok: boolean; output: string }> {
  const deadline = Date.now() + timeoutMs;
  let last: { ok: boolean; output: string } = { ok: false, output: '' };

  while (Date.now() < deadline) {
    throwIfAborted(signal);

    if (isContainerRunning && !(await isContainerRunning())) {
      last = {
        ok: false,
        output:
          'CS2 container is not running (crash loop or still starting). Waiting…',
      };
      onProgress(last.output);
      await sleep(3_000, signal);
      continue;
    }

    try {
      await startConsole?.();
      last = await verifyPlugin(plugin, runConsole);
      if (last.ok) return last;
      onProgress(
        `Waiting for ${plugin.id} to load (${plugin.verifyCommand})…`,
      );
    } catch (error) {
      last = {
        ok: false,
        output: error instanceof Error ? error.message : String(error),
      };
      onProgress(`Console not ready yet for ${plugin.id}; retrying…`);
    }
    await sleep(5_000, signal);
  }

  return last;
}

function formatVerifyFailure(plugin: PluginSpec, output: string): string {
  const trimmed = output.trim().slice(0, 500) || '(no output)';
  if (/container is not running|console is not attached|crash loop/i.test(trimmed)) {
    return (
      `${plugin.id} ${plugin.version} could not be verified because the CS2 server was not running. ` +
      `Output: ${trimmed}`
    );
  }
  return (
    `${plugin.id} ${plugin.version} did not load. \`${plugin.verifyCommand}\` returned: ${trimmed}. ` +
    `This usually means the pinned build does not match the current CS2 version.`
  );
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
