import { WebSocket } from 'ws';
import {
  encodeMessage,
  parseHubMessage,
  PROTOCOL_VERSION,
  type AgentMessage,
  type Command,
  type HostInfo,
  type InstanceSnapshot,
  type TaskPhase,
} from '@ppanel/protocol';
import type { AgentConfig } from './config.js';
import { log } from './logger.js';
import { Spool } from './spool.js';

export type CommandHandler = (
  taskId: string,
  command: Command,
  signal: AbortSignal,
) => Promise<unknown>;

export interface HubClientHooks {
  onCommand: CommandHandler;
  collectHello: () => Promise<{
    host: HostInfo;
    instances: InstanceSnapshot[];
  }>;
  collectHeartbeat: () => Promise<Partial<HostInfo>>;
}

/** Live view only; replaying an hour of scrollback after a reconnect is noise. */
const EPHEMERAL_TYPES = new Set<AgentMessage['type']>([
  'consoleLine',
  'pong',
  'heartbeat',
]);

export class HubClient {
  private ws: WebSocket | null = null;
  private seq = 0;
  private readonly spool: Spool;
  private reconnectDelay: number;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private stopped = false;
  private connected = false;
  private readonly controllers = new Map<string, AbortController>();

  constructor(
    private readonly config: AgentConfig,
    private readonly hooks: HubClientHooks,
  ) {
    this.spool = new Spool(config.stateDir);
    this.reconnectDelay = config.reconnect.initialDelayMs;
  }

  get isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  start(): void {
    this.stopped = false;
    this.open();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.ws?.close(1001, 'agent shutting down');
    await this.spool.flushToDisk();
  }

  private open(): void {
    const url = `${this.config.hubUrl.replace(/\/$/, '')}/agent`;
    log.info('connecting to hub', { url });

    const ws = new WebSocket(url, {
      headers: { authorization: `Bearer ${this.config.token}` },
      handshakeTimeout: 15_000,
    });
    this.ws = ws;

    ws.on('open', () => {
      this.connected = true;
      this.reconnectDelay = this.config.reconnect.initialDelayMs;
      log.info('connected to hub');
      void this.sayHello();
    });

    ws.on('message', (raw) => {
      void this.handleMessage(raw.toString()).catch((error: unknown) => {
        log.error('failed to handle hub message', { error });
      });
    });

    ws.on('close', (code, reason) => {
      this.connected = false;
      const text = reason.toString() || 'no reason given';
      // 4400 is a protocol mismatch and 4401 a revoked token; both need an
      // operator, so retrying every few seconds only fills the logs.
      const fatal = code === 4400 || code === 4401;
      log[fatal ? 'error' : 'warn']('hub connection closed', { code, reason: text });
      this.stopHeartbeat();
      if (!this.stopped) this.scheduleReconnect(fatal);
    });

    ws.on('error', (error) => {
      log.warn('hub connection error', { error });
    });
  }

  private scheduleReconnect(fatal: boolean): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const base = fatal
      ? this.config.reconnect.maxDelayMs
      : Math.min(this.reconnectDelay, this.config.reconnect.maxDelayMs);
    // Jitter stops every agent in a fleet from reconnecting in lockstep after a
    // hub restart.
    const delay = Math.round(base * (0.7 + Math.random() * 0.6));

    log.info('reconnecting to hub', { delayMs: delay });
    this.reconnectTimer = setTimeout(() => this.open(), delay);
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.config.reconnect.maxDelayMs,
    );
  }

  private async sayHello(): Promise<void> {
    try {
      const { host, instances } = await this.hooks.collectHello();
      this.transmit({
        type: 'hello',
        seq: this.nextSeq(),
        protocolVersion: PROTOCOL_VERSION,
        agentVersion: this.config.version,
        host,
        instances,
      });
    } catch (error) {
      log.error('failed to build the hello message', { error });
    }
  }

  private startHeartbeat(intervalMs: number): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      void this.hooks
        .collectHeartbeat()
        .then((host) => {
          this.send({
            type: 'heartbeat',
            seq: 0,
            ts: new Date().toISOString(),
            host,
          });
        })
        .catch((error: unknown) => {
          log.warn('heartbeat collection failed', { error });
        });
    }, intervalMs);
    this.heartbeatTimer.unref?.();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private async handleMessage(raw: string): Promise<void> {
    const message = parseHubMessage(raw);

    switch (message.type) {
      case 'welcome':
        log.info('hub accepted the agent', {
          heartbeatIntervalMs: message.heartbeatIntervalMs,
        });
        this.startHeartbeat(message.heartbeatIntervalMs);
        await this.replaySpool();
        break;

      case 'ping':
        this.send({ type: 'pong', seq: 0, ts: new Date().toISOString() });
        break;

      case 'ack':
        break;

      case 'error':
        log.error('hub reported an error', {
          code: message.code,
          message: message.message,
        });
        break;

      case 'command':
        await this.runCommand(message.taskId, message.command);
        break;

      case 'cancel': {
        const controller = this.controllers.get(message.taskId);
        if (controller) {
          log.info('cancelling command', { taskId: message.taskId });
          controller.abort();
        }
        break;
      }
    }
  }

  private async runCommand(taskId: string, command: Command): Promise<void> {
    log.info('command received', { taskId, type: command.type });
    const controller = new AbortController();
    this.controllers.set(taskId, controller);
    try {
      const data = await this.hooks.onCommand(taskId, command, controller.signal);
      this.send({
        type: 'taskResult',
        seq: 0,
        taskId,
        ok: true,
        data: data ?? null,
        error: null,
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      log.error('command failed', { taskId, type: command.type, error });
      this.send({
        type: 'taskResult',
        seq: 0,
        taskId,
        ok: false,
        data: null,
        error: text,
      });
    } finally {
      this.controllers.delete(taskId);
    }
  }

  private async replaySpool(): Promise<void> {
    const buffered = await this.spool.drain();
    if (buffered.length === 0) return;

    log.info('replaying buffered messages', { count: buffered.length });
    for (const encoded of buffered) {
      if (!this.isConnected) {
        await this.spool.push(encoded);
        continue;
      }
      this.ws?.send(encoded);
    }
  }

  progress(
    taskId: string,
    phase: TaskPhase,
    message: string,
    percent: number | null = null,
  ): void {
    this.send({
      type: 'taskProgress',
      seq: 0,
      taskId,
      phase,
      percent,
      message,
    });
  }

  /** Assigns a sequence number, then sends or buffers depending on the link. */
  send(message: AgentMessage): void {
    const withSeq = { ...message, seq: this.nextSeq() } as AgentMessage;
    this.transmit(withSeq);
  }

  private transmit(message: AgentMessage): void {
    const encoded = encodeMessage(message);
    if (this.isConnected) {
      this.ws?.send(encoded);
      return;
    }
    if (EPHEMERAL_TYPES.has(message.type)) return;
    void this.spool.push(encoded);
  }

  private nextSeq(): number {
    this.seq += 1;
    return this.seq;
  }
}
