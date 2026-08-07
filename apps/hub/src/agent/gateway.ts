import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';
import { hashAgentToken, type InstanceState as DbInstanceState } from '@ppanel/db';
import type { AgentMessage, InstanceSnapshot, InstanceState } from '@ppanel/protocol';
import { bus } from '../bus.js';
import type { HubConfig } from '../config.js';
import { db } from '../db.js';
import { mergeServerHostInfo } from '../host-info.js';
import { logger } from '../logger.js';
import { updateTask } from '../tasks.js';
import { AgentConnection } from './connection.js';
import { ingest } from './ingest.js';
import { agents } from './registry.js';

const AGENT_PATH = '/agent';

const STATE_MAP: Record<InstanceState, DbInstanceState> = {
  creating: 'CREATING',
  installing: 'INSTALLING',
  stopped: 'STOPPED',
  starting: 'STARTING',
  running: 'RUNNING',
  stopping: 'STOPPING',
  updating: 'UPDATING',
  error: 'ERROR',
  removed: 'REMOVED',
};

export function attachAgentGateway(server: Server, config: HubConfig): () => void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (!request.url?.startsWith(AGENT_PATH)) return;

    void authenticate(request)
      .then((serverId) => {
        if (!serverId) {
          reject(socket, 401, 'Unauthorized');
          return;
        }
        // The address the agent dials in from is more trustworthy than
        // anything the host can work out about its own public IP.
        const remoteIp = normalizeIp(
          (request.headers['x-forwarded-for'] as string | undefined)
            ?.split(',')[0]
            ?.trim() ?? request.socket.remoteAddress,
        );
        wss.handleUpgrade(request, socket, head, (ws) => {
          onConnected(ws, serverId, config, remoteIp);
        });
      })
      .catch((error: unknown) => {
        logger.error({ error }, 'agent upgrade failed');
        reject(socket, 500, 'Internal Server Error');
      });
  });

  const heartbeat = setInterval(() => {
    const deadline = Date.now() - config.agentTimeoutMs;
    for (const connection of agents.all()) {
      if (connection.lastSeenAt < deadline) {
        logger.warn(
          { serverId: connection.serverId },
          'agent went quiet, closing the connection',
        );
        connection.close(4408, 'heartbeat timeout');
        continue;
      }
      connection.ping();
    }
  }, config.heartbeatIntervalMs);
  heartbeat.unref?.();

  return () => {
    clearInterval(heartbeat);
    wss.close();
  };
}

async function authenticate(request: IncomingMessage): Promise<string | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  // Lookup is by hash, so a leaked database gives an attacker nothing to replay.
  const record = await db().agentToken.findUnique({
    where: { tokenHash: hashAgentToken(token) },
    select: { serverId: true, revokedAt: true },
  });
  if (!record || record.revokedAt) return null;

  await db()
    .agentToken.update({
      where: { serverId: record.serverId },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => undefined);

  return record.serverId;
}

function reject(socket: Duplex, code: number, message: string): void {
  socket.write(
    `HTTP/1.1 ${code} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
  socket.destroy();
}

function normalizeIp(raw: string | undefined): string | null {
  if (!raw) return null;
  // Node reports IPv4 peers on a dual-stack socket in the ::ffff: form.
  return raw.replace(/^::ffff:/, '');
}

function onConnected(
  ws: WebSocket,
  serverId: string,
  config: HubConfig,
  remoteIp: string | null,
): void {
  const log = logger.child({ serverId });
  log.info('agent connected');

  const connection = new AgentConnection(
    serverId,
    ws,
    {
      onMessage: (conn, message) => {
        void handleMessage(conn.serverId, message, remoteIp).catch((error: unknown) => {
          log.error({ error, type: message.type }, 'failed to handle agent message');
        });
        if ('seq' in message) conn.ack(message.seq);
      },
      onClose: (conn) => {
        agents.unregister(conn);
        log.info('agent disconnected');
        void db()
          .server.update({
            where: { id: serverId },
            data: { status: 'OFFLINE' },
          })
          .catch(() => undefined);
        bus.publish(`server:${serverId}`, { status: 'OFFLINE' });
      },
    },
    config.heartbeatIntervalMs,
  );

  agents.register(connection);
  connection.welcome(0);
}

async function handleMessage(
  serverId: string,
  message: AgentMessage,
  remoteIp: string | null,
): Promise<void> {
  switch (message.type) {
    case 'hello': {
      const host = await mergeServerHostInfo(serverId, {
        ...message.host,
        publicIp: remoteIp,
      });
      await db().server.update({
        where: { id: serverId },
        data: {
          status: 'ONLINE',
          agentVersion: message.agentVersion,
          lastSeenAt: new Date(),
          publicIp: remoteIp,
          lastError: null,
        },
      });
      for (const snapshot of message.instances) {
        await syncInstanceState(snapshot.instanceId, snapshot);
      }
      bus.publish(`server:${serverId}`, {
        status: 'ONLINE',
        host,
      });
      break;
    }

    case 'heartbeat': {
      const host = await mergeServerHostInfo(serverId, message.host);
      await db().server.update({
        where: { id: serverId },
        data: {
          lastSeenAt: new Date(),
          status: 'ONLINE',
        },
      });
      bus.publish(`server:${serverId}`, { status: 'ONLINE', host });
      break;
    }

    case 'pong':
      break;

    case 'taskProgress':
      await updateTask(message.taskId, {
        status: 'RUNNING',
        phase: message.phase,
        percent: message.percent,
        message: message.message,
      });
      break;

    case 'taskResult':
      await updateTask(message.taskId, {
        status: message.ok ? 'SUCCEEDED' : 'FAILED',
        phase: message.ok ? 'done' : 'failed',
        percent: message.ok ? 100 : null,
        message: message.ok ? 'Completed' : (message.error ?? 'Failed'),
        error: message.error,
        result: message.data,
      });
      break;

    case 'consoleLine':
      ingest.console(message.instanceId, message.ts, message.line);
      break;

    case 'gameEvents':
      ingest.events(message.instanceId, message.events);
      break;

    case 'instanceState':
      await syncInstanceState(message.snapshot.instanceId, message.snapshot);
      break;
  }
}

async function syncInstanceState(
  instanceId: string,
  snapshot: InstanceSnapshot,
): Promise<void> {
  const state = STATE_MAP[snapshot.state];

  const updated = await db()
    .gameInstance.update({
      where: { id: instanceId },
      data: {
        state,
        containerId: snapshot.containerId,
        ...(snapshot.buildId ? { buildId: snapshot.buildId } : {}),
        startedAt: snapshot.startedAt ? new Date(snapshot.startedAt) : null,
        lastError: snapshot.error,
      },
      select: { buildId: true, pluginsOkBuildId: true },
    })
    .catch((error: unknown) => {
      // The agent may still know about an instance the panel already deleted.
      logger.warn({ instanceId, error }, 'could not sync instance state');
      return null;
    });

  // A new Steam build id means Valve shipped a patch. Metamod and
  // CounterStrikeSharp link against the game binaries and stop loading often
  // enough that the previous "installed" verdict cannot be carried over: the
  // plugins are flagged for a recheck instead of quietly claiming to work.
  if (
    updated?.buildId &&
    updated.pluginsOkBuildId &&
    updated.buildId !== updated.pluginsOkBuildId
  ) {
    const flagged = await db().pluginInstall.updateMany({
      where: { instanceId, status: 'INSTALLED' },
      data: { status: 'NEEDS_RECHECK' },
    });
    if (flagged.count > 0) {
      logger.warn(
        { instanceId, buildId: updated.buildId, plugins: flagged.count },
        'CS2 build changed, plugins need rechecking',
      );
      bus.publish(`instance:${instanceId}`, {
        ...snapshot,
        pluginsNeedRecheck: true,
      });
    }
  }

  bus.publish(`instance:${instanceId}`, snapshot);
}
