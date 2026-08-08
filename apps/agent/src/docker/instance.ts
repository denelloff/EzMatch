import type Docker from 'dockerode';
import type {
  Cs2Config,
  InstanceSnapshot,
  InstanceState,
  PortAllocation,
} from '@ppanel/protocol';
import type { AgentConfig } from '../config.js';
import { log } from '../logger.js';
import {
  containerExists,
  docker,
  ensureNetwork,
  ensureVolume,
  isNotFound,
  pullImage,
} from './client.js';
import { ConsoleSession } from './console.js';
import { readTextFile } from './archive.js';
import { APPMANIFEST_PATH, CS2_ROOT } from './paths.js';
import { allocatePorts } from './ports.js';
import {
  gsltProblem,
  isInstallComplete,
  isServerReady,
  parseSteamProgress,
  steamError,
} from './steamcmd.js';

/** Fixed inside the container; only the host-side port varies per instance. */
const INTERNAL_GAME_PORT = 27015;
const INTERNAL_TV_PORT = 27020;

const LABEL_MANAGED = 'ppanel.managed';
const LABEL_INSTANCE = 'ppanel.instanceId';

export interface ProgressReporter {
  (phase: string, message: string, percent: number | null): void;
}

export interface ManagedInstance {
  instanceId: string;
  containerName: string;
  volumeName: string;
  ports: PortAllocation;
  state: InstanceState;
  buildId: string | null;
  startedAt: string | null;
  error: string | null;
  console: ConsoleSession;
  /** Values masked out of console output and logs. */
  secrets: string[];
  autoRestart: boolean;
}

export type InstanceChangeListener = (snapshot: InstanceSnapshot) => void;
export type ConsoleLineListener = (
  instanceId: string,
  line: string,
  ts: string,
) => void;

export function containerNameFor(instanceId: string): string {
  return `ppanel-cs2-${instanceId}`;
}

export function volumeNameFor(instanceId: string): string {
  return `ppanel-cs2-${instanceId}-data`;
}

export class InstanceManager {
  private readonly instances = new Map<string, ManagedInstance>();
  private readonly listeners = new Set<InstanceChangeListener>();
  private readonly consoleListeners = new Set<ConsoleLineListener>();

  constructor(private readonly config: AgentConfig) {}

  onChange(listener: InstanceChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Console output is forwarded for every instance, whether or not a browser
   * tab is watching, so the hub always has scrollback to backfill a newly
   * opened console from.
   */
  onConsoleLine(listener: ConsoleLineListener): void {
    this.consoleListeners.add(listener);
  }

  private wireConsole(instance: ManagedInstance): void {
    instance.console.subscribe((line, ts) => {
      for (const listener of this.consoleListeners) {
        try {
          listener(instance.instanceId, line, ts);
        } catch (error) {
          log.warn('console line listener threw', { error });
        }
      }
    });
  }

  list(): ManagedInstance[] {
    return [...this.instances.values()];
  }

  snapshots(): InstanceSnapshot[] {
    return this.list().map((instance) => this.snapshot(instance));
  }

  get(instanceId: string): ManagedInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error(`Unknown instance ${instanceId}`);
    return instance;
  }

  /**
   * Rebuilds the in-memory view from Docker labels after an agent restart.
   * The containers are the source of truth, so the agent keeps no state file
   * that could drift away from reality.
   */
  async adopt(): Promise<void> {
    const containers = await docker.listContainers({
      all: true,
      filters: { label: [`${LABEL_MANAGED}=true`] },
    });

    for (const summary of containers) {
      const instanceId = summary.Labels?.[LABEL_INSTANCE];
      if (!instanceId) continue;

      const containerName = containerNameFor(instanceId);
      const details = await docker
        .getContainer(summary.Id)
        .inspect()
        .catch(() => null);

      const ports: PortAllocation = {
        game: hostPortOf(details, `${INTERNAL_GAME_PORT}/udp`) ?? INTERNAL_GAME_PORT,
        tv: hostPortOf(details, `${INTERNAL_TV_PORT}/udp`) ?? INTERNAL_TV_PORT,
      };

      const instance: ManagedInstance = {
        instanceId,
        containerName,
        volumeName: volumeNameFor(instanceId),
        ports,
        state: details?.State.Running ? 'running' : 'stopped',
        buildId: null,
        startedAt: details?.State.StartedAt ?? null,
        error: null,
        console: new ConsoleSession(instanceId, containerName),
        secrets: secretsFromEnv(details?.Config.Env ?? []),
        autoRestart: true,
      };
      instance.console.setSecrets(instance.secrets);

      this.instances.set(instanceId, instance);
      this.wireConsole(instance);
      log.info('adopted existing instance', { instanceId, state: instance.state });

      if (instance.state === 'running') {
        void instance.console.start();
        void this.refreshBuildId(instance);
      }
    }
  }

  async create(input: {
    instanceId: string;
    config: Cs2Config;
    ports: PortAllocation;
    minFreeBytes: number;
    report: ProgressReporter;
    freeBytes: number;
  }): Promise<{ ports: PortAllocation; buildId: string | null }> {
    const { instanceId, config, report } = input;

    report('preflight', 'Checking free disk space', 2);
    if (input.freeBytes < input.minFreeBytes) {
      throw new Error(
        `Not enough free disk: ${formatGb(input.freeBytes)} available, ${formatGb(
          input.minFreeBytes,
        )} required. CS2 alone is about 60 GB.`,
      );
    }

    const containerName = containerNameFor(instanceId);
    if (await containerExists(containerName)) {
      throw new Error(`Container ${containerName} already exists`);
    }

    const allocation = await allocatePorts(input.ports);
    if (allocation.changed) {
      report(
        'preflight',
        `Requested ports were taken, using ${allocation.ports.game} and ${allocation.ports.tv}`,
        4,
      );
    }

    const volumeName = volumeNameFor(instanceId);
    report('creating-volume', 'Creating the data volume', 6);
    await ensureNetwork(this.config.network);
    await ensureVolume(volumeName);

    report('pulling-image', `Pulling ${this.config.cs2Image}`, 8);
    await pullImage(this.config.cs2Image, (event) => {
      if (event.status) report('pulling-image', event.status, null);
    });

    report('creating-container', 'Creating the container', 12);
    const secrets = [config.gsltToken, config.rconPassword, config.joinPassword];

    const instance: ManagedInstance = {
      instanceId,
      containerName,
      volumeName,
      ports: allocation.ports,
      state: 'creating',
      buildId: null,
      startedAt: null,
      error: null,
      console: new ConsoleSession(instanceId, containerName),
      secrets,
      autoRestart: true,
    };
    instance.console.setSecrets(secrets);
    this.instances.set(instanceId, instance);
    this.wireConsole(instance);

    await docker.createContainer({
      name: containerName,
      Image: this.config.cs2Image,
      // The CS2 server console is an interactive terminal; without stdin the
      // agent has no way to drive the server at all.
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      Env: buildEnv(config, this.config),
      Labels: {
        [LABEL_MANAGED]: 'true',
        [LABEL_INSTANCE]: instanceId,
        'ppanel.role': 'cs2',
      },
      ExposedPorts: {
        [`${INTERNAL_GAME_PORT}/tcp`]: {},
        [`${INTERNAL_GAME_PORT}/udp`]: {},
        [`${INTERNAL_TV_PORT}/udp`]: {},
      },
      HostConfig: {
        Binds: [`${volumeName}:${CS2_ROOT}`],
        NetworkMode: this.config.network,
        PortBindings: {
          [`${INTERNAL_GAME_PORT}/tcp`]: [
            { HostPort: String(allocation.ports.game) },
          ],
          [`${INTERNAL_GAME_PORT}/udp`]: [
            { HostPort: String(allocation.ports.game) },
          ],
          [`${INTERNAL_TV_PORT}/udp`]: [{ HostPort: String(allocation.ports.tv) }],
        },
        // Deliberately `no`. The image runs SteamCMD on every start, so an
        // unsupervised Docker restart would silently upgrade CS2 and can break
        // Metamod and CounterStrikeSharp mid-match. The agent restarts instead.
        RestartPolicy: { Name: 'no' },
      },
    });

    this.setState(instance, 'installing');
    report('downloading-game', 'Starting SteamCMD', 15);

    await docker.getContainer(containerName).start();
    await this.followInstall(instance, report);

    await this.refreshBuildId(instance);
    void instance.console.start();
    this.setState(instance, 'running');

    return { ports: allocation.ports, buildId: instance.buildId };
  }

  /**
   * Follows container output until the game is installed and the server is up.
   * Progress comes from SteamCMD's own state lines.
   */
  private async followInstall(
    instance: ManagedInstance,
    report: ProgressReporter,
  ): Promise<void> {
    const container = docker.getContainer(instance.containerName);
    const stream = (await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 0,
    })) as NodeJS.ReadableStream;

    let installed = false;
    let buffer = '';
    let lastReported = 0;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          cleanup();
          reject(
            new Error(
              'CS2 did not finish installing within 4 hours. Check the host network and disk.',
            ),
          );
        },
        4 * 60 * 60_000,
      );

      const cleanup = () => {
        clearTimeout(timeout);
        stream.removeAllListeners();
        (stream as unknown as { destroy?: () => void }).destroy?.();
      };

      const handleLine = (line: string) => {
        const cleaned = line.replace(/\r$/, '').trimEnd();
        const failure = steamError(cleaned);
        if (failure) {
          cleanup();
          reject(new Error(`SteamCMD failed: ${failure}`));
          return;
        }

        // Full console into the live task stream (percent null → SSE only).
        if (cleaned.trim()) {
          report('downloading-game', cleaned.trim().slice(0, 500), null);
        }

        const gslt = gsltProblem(cleaned);
        if (gslt) report('downloading-game', gslt, lastReported || 15);

        const progress = parseSteamProgress(cleaned);
        if (progress) {
          // 15..85 % of the task is the download itself.
          const percent =
            progress.percent != null
              ? 15 + Math.round((progress.percent / 100) * 70)
              : null;
          if (percent == null || percent >= lastReported) {
            lastReported = percent ?? lastReported;
            report(
              'downloading-game',
              progress.totalBytes
                ? `${progress.phase} ${formatGb(progress.downloadedBytes ?? 0)} of ${formatGb(progress.totalBytes)}`
                : progress.phase,
              percent,
            );
          }
          return;
        }

        if (!installed && isInstallComplete(cleaned)) {
          installed = true;
          report('starting', 'Game installed, starting the server', 88);
          return;
        }

        if (isServerReady(cleaned)) {
          report('verifying', 'Server is up', 95);
          cleanup();
          resolve();
        }
      };

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) handleLine(line.replace(/\r$/, ''));
      });

      stream.on('error', (error: Error) => {
        cleanup();
        reject(error);
      });

      stream.on('end', () => {
        cleanup();
        if (installed) {
          resolve();
          return;
        }
        reject(
          new Error('The container exited before CS2 finished installing'),
        );
      });
    });
  }

  async start(instanceId: string): Promise<void> {
    const instance = this.get(instanceId);
    this.setState(instance, 'starting');
    await docker.getContainer(instance.containerName).start();
    await this.refreshBuildId(instance);
    void instance.console.start();
    this.setState(instance, 'running');
  }

  async stop(instanceId: string, timeoutSec: number): Promise<void> {
    const instance = this.get(instanceId);
    this.setState(instance, 'stopping');
    instance.console.stop();
    try {
      await docker.getContainer(instance.containerName).stop({ t: timeoutSec });
    } catch (error) {
      // 304 means it was already stopped, which is the state we wanted.
      if ((error as { statusCode?: number }).statusCode !== 304) throw error;
    }
    this.setState(instance, 'stopped');
  }

  async restart(instanceId: string): Promise<void> {
    await this.stop(instanceId, 30);
    await this.start(instanceId);
  }

  async remove(
    instanceId: string,
    removeVolume: boolean,
    names?: { containerName?: string; volumeName?: string },
  ): Promise<void> {
    const managed = this.instances.get(instanceId);
    managed?.console.stop();

    const containerName = managed?.containerName ?? names?.containerName;
    const volumeName = managed?.volumeName ?? names?.volumeName;

    // Prefer label lookup so a half-created install is still cleaned up.
    try {
      const listed = await docker.listContainers({
        all: true,
        filters: { label: [`${LABEL_INSTANCE}=${instanceId}`] },
      });
      for (const summary of listed) {
        await docker.getContainer(summary.Id).remove({ force: true }).catch((error: unknown) => {
          if (!isNotFound(error)) throw error;
        });
      }
    } catch (error) {
      log.warn('label-based container cleanup failed', { instanceId, error });
    }

    if (containerName) {
      try {
        await docker.getContainer(containerName).remove({ force: true });
      } catch (error) {
        if (!isNotFound(error)) throw error;
      }
    }

    if (removeVolume && volumeName) {
      try {
        await docker.getVolume(volumeName).remove();
      } catch (error) {
        if (!isNotFound(error)) throw error;
      }
    }

    if (managed) {
      this.setState(managed, 'removed');
      this.instances.delete(instanceId);
    }
  }

  /**
   * Applies a CS2 update. The image runs SteamCMD on start, so an update is a
   * controlled stop and start, and the build id is compared before and after so
   * the panel can warn that plugins need rechecking.
   */
  async update(
    instanceId: string,
    validate: boolean,
    report: ProgressReporter,
  ): Promise<{ previousBuildId: string | null; buildId: string | null }> {
    const instance = this.get(instanceId);
    const previousBuildId = instance.buildId ?? (await this.readBuildId(instance));

    this.setState(instance, 'updating');
    report('stopping', 'Stopping the server', 5);
    instance.console.stop();

    const container = docker.getContainer(instance.containerName);
    await container.stop({ t: 30 }).catch((error: unknown) => {
      if ((error as { statusCode?: number }).statusCode !== 304) throw error;
    });

    if (validate) {
      // STEAMAPPVALIDATE makes SteamCMD checksum every file, which takes far
      // longer but repairs a partially corrupted install.
      await recreateWithEnv(instance, { STEAMAPPVALIDATE: '1' });
    }

    report('updating', 'Running SteamCMD', 15);
    await docker.getContainer(instance.containerName).start();
    await this.followInstall(instance, report);

    if (validate) {
      await recreateWithEnv(instance, { STEAMAPPVALIDATE: '0' });
      await docker.getContainer(instance.containerName).start();
    }

    const buildId = await this.readBuildId(instance);
    instance.buildId = buildId;
    void instance.console.start();
    this.setState(instance, 'running');

    return { previousBuildId, buildId };
  }

  async inspect(instanceId: string): Promise<InstanceSnapshot> {
    const instance = this.get(instanceId);
    const details = await docker
      .getContainer(instance.containerName)
      .inspect()
      .catch(() => null);

    if (details) {
      instance.state = details.State.Running ? 'running' : 'stopped';
      instance.startedAt = details.State.Running ? details.State.StartedAt : null;
    }
    await this.refreshBuildId(instance);
    return this.snapshot(instance);
  }

  private async refreshBuildId(instance: ManagedInstance): Promise<void> {
    const buildId = await this.readBuildId(instance);
    if (buildId && buildId !== instance.buildId) {
      instance.buildId = buildId;
      this.emit(instance);
    }
  }

  /** Reads the installed build from Steam's own manifest inside the volume. */
  private async readBuildId(instance: ManagedInstance): Promise<string | null> {
    try {
      const container = docker.getContainer(instance.containerName);
      const contents = await readTextFile(container, APPMANIFEST_PATH);
      if (!contents) return null;
      const match = /"buildid"\s+"(\d+)"/.exec(contents);
      return match?.[1] ?? null;
    } catch (error) {
      log.debug('could not read the appmanifest', {
        instanceId: instance.instanceId,
        error,
      });
      return null;
    }
  }

  setState(instance: ManagedInstance, state: InstanceState, error?: string): void {
    instance.state = state;
    instance.error = error ?? null;
    this.emit(instance);
  }

  snapshot(instance: ManagedInstance): InstanceSnapshot {
    return {
      instanceId: instance.instanceId,
      state: instance.state,
      containerId: instance.containerName,
      buildId: instance.buildId,
      startedAt: instance.startedAt,
      error: instance.error,
    };
  }

  private emit(instance: ManagedInstance): void {
    const snapshot = this.snapshot(instance);
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (error) {
        log.warn('instance listener threw', { error });
      }
    }
  }
}

function buildAdditionalArgs(config: Cs2Config): string {
  const parts: string[] = [];
  if (config.vacDisabled) parts.push('-insecure');
  const extra = config.extraArgs.trim();
  if (extra) parts.push(extra);
  return parts.join(' ');
}

function buildEnv(config: Cs2Config, agent: AgentConfig): string[] {
  const env: Record<string, string> = {
    SRCDS_TOKEN: config.gsltToken,
    CS2_SERVERNAME: config.serverName,
    CS2_PORT: String(INTERNAL_GAME_PORT),
    CS2_RCON_PORT: String(INTERNAL_GAME_PORT),
    CS2_TV_PORT: String(INTERNAL_TV_PORT),
    CS2_RCONPW: config.rconPassword,
    CS2_PW: config.joinPassword,
    CS2_MAXPLAYERS: String(config.maxPlayers),
    CS2_GAMETYPE: String(config.gameType),
    CS2_GAMEMODE: String(config.gameMode),
    CS2_STARTMAP: config.startMap,
    CS2_LAN: config.lan ? '1' : '0',
    CS2_SERVER_HIBERNATE: config.hibernate ? '1' : '0',
    CS2_ADDITIONAL_ARGS: buildAdditionalArgs(config),
    CS2_BOT_QUOTA: '0',
    STEAMAPPVALIDATE: '0',
    TZ: process.env.TZ ?? 'UTC',
    // The panel applies logging cvars over the console once the server is up,
    // but setting them here means a restart never loses the log feed.
    CS2_LOG: 'on',
    CS2_LOG_DETAIL: '3',
    CS2_LOG_MONEY: '0',
    CS2_LOG_ITEMS: '0',
    PPANEL_AGENT_HOST: agent.agentHost,
    PPANEL_LOG_PORT: String(agent.logPort),
  };

  return Object.entries(env).map(([key, value]) => `${key}=${value}`);
}

function secretsFromEnv(env: string[]): string[] {
  const wanted = new Set(['SRCDS_TOKEN', 'CS2_RCONPW', 'CS2_PW']);
  const secrets: string[] = [];
  for (const entry of env) {
    const index = entry.indexOf('=');
    if (index === -1) continue;
    if (wanted.has(entry.slice(0, index))) {
      const value = entry.slice(index + 1);
      if (value) secrets.push(value);
    }
  }
  return secrets;
}

function hostPortOf(
  details: Docker.ContainerInspectInfo | null,
  key: string,
): number | null {
  const binding = details?.HostConfig?.PortBindings?.[key]?.[0]?.HostPort;
  const value = Number.parseInt(binding ?? '', 10);
  return Number.isFinite(value) ? value : null;
}

/** Recreates the container with the same settings plus an env override. */
async function recreateWithEnv(
  instance: ManagedInstance,
  overrides: Record<string, string>,
): Promise<void> {
  const container = docker.getContainer(instance.containerName);
  const details = await container.inspect();

  const env = (details.Config.Env ?? []).filter((entry) => {
    const key = entry.slice(0, entry.indexOf('='));
    return !(key in overrides);
  });
  for (const [key, value] of Object.entries(overrides)) {
    env.push(`${key}=${value}`);
  }

  await container.remove({ force: true });
  await docker.createContainer({
    name: instance.containerName,
    Image: details.Config.Image,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    Env: env,
    Labels: details.Config.Labels,
    ExposedPorts: details.Config.ExposedPorts,
    HostConfig: details.HostConfig,
  });
}

function formatGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
