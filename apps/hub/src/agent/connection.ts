import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import {
  encodeMessage,
  parseAgentMessage,
  PROTOCOL_VERSION,
  type AgentMessage,
  type Command,
  type HostInfo,
  type HubMessage,
  type InstanceSnapshot,
} from '@ppanel/protocol';
import { logger } from '../logger.js';

export interface PendingCommand {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
  type: Command['type'];
}

export class ProtocolMismatchError extends Error {}

export interface AgentConnectionHandlers {
  onMessage: (connection: AgentConnection, message: AgentMessage) => void;
  onClose: (connection: AgentConnection) => void;
}

const DEFAULT_COMMAND_TIMEOUT_MS = 60_000;

/**
 * Commands that legitimately take far longer than a normal request. Installing
 * CS2 downloads roughly 60 GB, which on a modest link is comfortably past an
 * hour.
 */
const COMMAND_TIMEOUT_MS: Partial<Record<Command['type'], number>> = {
  'instance.create': 4 * 60 * 60_000,
  'instance.update': 2 * 60 * 60_000,
  'plugin.install': 10 * 60_000,
  'plugin.remove': 5 * 60_000,
  'instance.stop': 5 * 60_000,
  'instance.remove': 10 * 60_000,
};

export class AgentConnection {
  readonly id = randomUUID();
  host: HostInfo | null = null;
  agentVersion = 'unknown';
  instances: InstanceSnapshot[] = [];
  lastSeenAt = Date.now();
  /** Highest sequence number persisted, echoed back so the agent can trim. */
  ackedSeq = 0;

  private readonly pending = new Map<string, PendingCommand>();
  private closed = false;

  constructor(
    readonly serverId: string,
    private readonly socket: WebSocket,
    private readonly handlers: AgentConnectionHandlers,
    private readonly heartbeatIntervalMs: number,
  ) {
    socket.on('message', (raw) => this.handleRaw(raw.toString()));
    socket.on('close', () => this.handleClose());
    socket.on('error', (error) => {
      logger.warn({ serverId, error }, 'agent socket error');
    });
  }

  get isOpen(): boolean {
    return !this.closed && this.socket.readyState === this.socket.OPEN;
  }

  send(message: HubMessage): void {
    if (!this.isOpen) return;
    this.socket.send(encodeMessage(message));
  }

  welcome(resumeFromSeq: number): void {
    this.send({
      type: 'welcome',
      serverId: this.serverId,
      heartbeatIntervalMs: this.heartbeatIntervalMs,
      resumeFromSeq,
    });
  }

  ping(): void {
    this.send({ type: 'ping', ts: new Date().toISOString() });
  }

  ack(upToSeq: number): void {
    if (upToSeq <= this.ackedSeq) return;
    this.ackedSeq = upToSeq;
    this.send({ type: 'ack', upToSeq });
  }

  /** Sends a command and resolves with the agent's `taskResult` payload. */
  dispatch(command: Command, taskId: string = randomUUID()): Promise<unknown> {
    if (!this.isOpen) {
      return Promise.reject(new Error('Agent is not connected'));
    }

    const timeoutMs = COMMAND_TIMEOUT_MS[command.type] ?? DEFAULT_COMMAND_TIMEOUT_MS;

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(taskId);
        reject(new Error(`Agent did not answer ${command.type} within ${timeoutMs}ms`));
      }, timeoutMs);
      timer.unref?.();

      this.pending.set(taskId, { resolve, reject, timer, type: command.type });
      this.send({ type: 'command', taskId, command });
    });
  }

  settle(taskId: string, ok: boolean, data: unknown, error: string | null): void {
    const pending = this.pending.get(taskId);
    if (!pending) return;
    this.pending.delete(taskId);
    clearTimeout(pending.timer);
    if (ok) {
      pending.resolve(data);
    } else {
      pending.reject(new Error(error ?? `${pending.type} failed`));
    }
  }

  close(code = 1000, reason = 'closed by hub'): void {
    if (this.closed) return;
    this.socket.close(code, reason);
  }

  private handleRaw(raw: string): void {
    this.lastSeenAt = Date.now();
    let message: AgentMessage;
    try {
      message = parseAgentMessage(raw);
    } catch (error) {
      logger.warn(
        { serverId: this.serverId, error },
        'discarding malformed agent message',
      );
      return;
    }

    if (message.type === 'hello') {
      if (message.protocolVersion !== PROTOCOL_VERSION) {
        this.send({
          type: 'error',
          code: 'PROTOCOL_MISMATCH',
          message: `Hub speaks protocol ${PROTOCOL_VERSION}, agent speaks ${message.protocolVersion}. Re-run the bootstrap to upgrade the agent.`,
          fatal: true,
        });
        this.close(4400, 'protocol mismatch');
        return;
      }
      this.host = message.host;
      this.agentVersion = message.agentVersion;
      this.instances = message.instances;
    }

    if (message.type === 'taskResult') {
      this.settle(message.taskId, message.ok, message.data, message.error);
    }

    this.handlers.onMessage(this, message);
  }

  private handleClose(): void {
    if (this.closed) return;
    this.closed = true;
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Agent disconnected before the command finished'));
    }
    this.pending.clear();
    this.handlers.onClose(this);
  }
}
