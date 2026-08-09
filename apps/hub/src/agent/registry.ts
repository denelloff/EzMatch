import type { Command } from '@ppanel/protocol';
import { logger } from '../logger.js';
import type { AgentConnection } from './connection.js';

export class AgentOfflineError extends Error {
  constructor(serverId: string) {
    super(`No agent is connected for server ${serverId}`);
    this.name = 'AgentOfflineError';
  }
}

class AgentRegistry {
  private readonly byServer = new Map<string, AgentConnection>();

  register(connection: AgentConnection): void {
    const existing = this.byServer.get(connection.serverId);
    if (existing && existing.id !== connection.id) {
      // A reconnect after a half-open socket: the old one has not noticed it is
      // dead yet, so close it explicitly rather than leaving two live sockets.
      logger.info(
        { serverId: connection.serverId },
        'replacing an existing agent connection',
      );
      existing.close(4409, 'replaced by a newer connection');
    }
    this.byServer.set(connection.serverId, connection);
  }

  unregister(connection: AgentConnection): void {
    const current = this.byServer.get(connection.serverId);
    if (current?.id === connection.id) {
      this.byServer.delete(connection.serverId);
    }
  }

  get(serverId: string): AgentConnection | undefined {
    const connection = this.byServer.get(serverId);
    return connection?.isOpen ? connection : undefined;
  }

  require(serverId: string): AgentConnection {
    const connection = this.get(serverId);
    if (!connection) throw new AgentOfflineError(serverId);
    return connection;
  }

  dispatch(serverId: string, command: Command, taskId?: string): Promise<unknown> {
    return this.require(serverId).dispatch(command, taskId);
  }

  all(): AgentConnection[] {
    return [...this.byServer.values()];
  }

  get size(): number {
    return this.byServer.size;
  }
}

export const agents = new AgentRegistry();

