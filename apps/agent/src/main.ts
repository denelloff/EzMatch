import { executeCommand } from './commands.js';
import { loadConfig } from './config.js';
import { dockerFacts, ensureNetwork } from './docker/client.js';
import { InstanceManager } from './docker/instance.js';
import { collectHostInfo } from './host.js';
import { HubClient } from './hub-client.js';
import { log } from './logger.js';
import { LogServer } from './logs/server.js';
import { collectNetworkRates } from './network.js';

const AGENT_VERSION = '0.1.3';

async function main(): Promise<void> {
  const config = loadConfig(AGENT_VERSION);
  log.info('agent starting', {
    version: AGENT_VERSION,
    serverId: config.serverId,
    hub: config.hubUrl,
  });

  const facts = await dockerFacts(true);
  if (!facts.version) {
    throw new Error(
      'Cannot reach the Docker daemon. Is /var/run/docker.sock mounted into this container?',
    );
  }
  log.info('docker ready', { version: facts.version, rootDir: facts.rootDir });

  await ensureNetwork(config.network);

  const instances = new InstanceManager(config);
  await instances.adopt();

  // The log receiver and the hub client refer to each other: logs are pushed
  // to the hub, and the hub's commands configure the log receiver. This holder
  // breaks the cycle without leaving either half half-initialised.
  const runtime: { hub: HubClient | null } = { hub: null };

  const logs = new LogServer(config.logPort, (instanceId, events) => {
    runtime.hub?.send({ type: 'gameEvents', seq: 0, instanceId, events });
  });
  await logs.start();

  const hub = new HubClient(config, {
    collectHello: async () => {
      const host = await collectHostInfo({
        dockerVersion: facts.version,
        dockerRoot: facts.rootDir,
      });
      const network = await collectNetworkRates();
      return {
        host: { ...host, ...network },
        instances: instances.snapshots(),
      };
    },
    collectHeartbeat: async () => {
      const current = await dockerFacts();
      const host = await collectHostInfo({
        dockerVersion: current.version,
        dockerRoot: current.rootDir,
      });
      const network = await collectNetworkRates();
      // Full snapshot each beat so the live host panel stays accurate (disks,
      // network rates, and static fields after agent reconnect).
      return {
        ...host,
        ...network,
      };
    },
    onCommand: (taskId, command) =>
      executeCommand(command, {
        config,
        instances,
        logs,
        progress: (phase, message, percent) => {
          hub.progress(taskId, phase as never, message, percent);
        },
      }),
  });

  runtime.hub = hub;

  instances.onChange((snapshot) => {
    hub.send({ type: 'instanceState', seq: 0, snapshot });
  });

  instances.onConsoleLine((instanceId, line, ts) => {
    hub.send({ type: 'consoleLine', seq: 0, instanceId, ts, line });
  });

  hub.start();

  const shutdown = async (signal: string) => {
    log.info('shutting down', { signal });
    await hub.stop();
    await logs.stop();
    for (const instance of instances.list()) instance.console.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  log.error('agent failed to start', { error });
  process.exit(1);
});
