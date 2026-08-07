export interface AgentConfig {
  serverId: string;
  token: string;
  hubUrl: string;
  /** Docker network shared by the agent and every CS2 container it manages. */
  network: string;
  /** Port the agent listens on for CS2 log deliveries. Network-internal only. */
  logPort: number;
  /** Hostname CS2 containers use to reach the agent. Its container name. */
  agentHost: string;
  stateDir: string;
  version: string;
  cs2Image: string;
  reconnect: {
    initialDelayMs: number;
    maxDelayMs: number;
  };
}

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

export function loadConfig(version: string): AgentConfig {
  const hubUrl = required('PPANEL_HUB_URL');
  if (!/^wss?:\/\//.test(hubUrl)) {
    throw new Error('PPANEL_HUB_URL must start with ws:// or wss://');
  }

  return {
    serverId: required('PPANEL_SERVER_ID'),
    token: required('PPANEL_AGENT_TOKEN'),
    hubUrl,
    network: process.env.PPANEL_NETWORK ?? 'ppanel',
    logPort: optionalInt('PPANEL_LOG_PORT', 8787),
    agentHost: process.env.PPANEL_AGENT_HOST ?? 'ppanel-agent',
    stateDir: process.env.PPANEL_STATE_DIR ?? '/var/lib/ppanel',
    version,
    cs2Image: process.env.PPANEL_CS2_IMAGE ?? 'joedwards32/cs2:latest',
    reconnect: {
      initialDelayMs: optionalInt('PPANEL_RECONNECT_MIN_MS', 1000),
      maxDelayMs: optionalInt('PPANEL_RECONNECT_MAX_MS', 60_000),
    },
  };
}
