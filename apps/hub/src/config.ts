import { loadMasterKey } from '@ppanel/db';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be an integer`);
  return parsed;
}

export interface HubConfig {
  host: string;
  port: number;
  databaseUrl: string;
  internalToken: string;
  masterKey: Buffer;
  heartbeatIntervalMs: number;
  /** A connection is dropped after this long without any frame from the agent. */
  agentTimeoutMs: number;
  /** Console scrollback kept per instance. Older rows are pruned in batches. */
  consoleRetentionLines: number;
  logLevel: string;
  agent: AgentDeployConfig;
}

export interface AgentDeployConfig {
  /** wss:// URL the agent dials back to. Must be reachable from game hosts. */
  hubPublicUrl: string;
  image: string;
  containerName: string;
  network: string;
  stateVolume: string;
  /** Port the agent exposes inside the Docker network for CS2 log delivery. */
  logPort: number;
  minFreeBytes: number;
}

export function loadConfig(): HubConfig {
  const heartbeatIntervalMs = optionalInt('HUB_HEARTBEAT_MS', 15_000);
  return {
    host: process.env.HUB_HOST ?? '0.0.0.0',
    port: optionalInt('HUB_PORT', 4000),
    databaseUrl: required('DATABASE_URL'),
    internalToken: required('HUB_INTERNAL_TOKEN'),
    masterKey: loadMasterKey(),
    heartbeatIntervalMs,
    agentTimeoutMs: optionalInt('HUB_AGENT_TIMEOUT_MS', heartbeatIntervalMs * 3),
    consoleRetentionLines: optionalInt('HUB_CONSOLE_RETENTION_LINES', 5000),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    agent: {
      hubPublicUrl: required('HUB_PUBLIC_URL'),
      image: process.env.AGENT_IMAGE ?? 'ghcr.io/ppanel/agent:0.1.0',
      containerName: process.env.AGENT_CONTAINER_NAME ?? 'ppanel-agent',
      network: process.env.AGENT_DOCKER_NETWORK ?? 'ppanel',
      stateVolume: process.env.AGENT_STATE_VOLUME ?? 'ppanel-agent-state',
      logPort: optionalInt('AGENT_LOG_PORT', 8787),
      // 85 GiB. CS2 is roughly 60 GB; the rest is plugins, demos and the
      // temporary extra copy SteamCMD needs while applying an update.
      minFreeBytes: optionalInt('AGENT_MIN_FREE_BYTES', 92_274_688_000),
    },
  };
}
