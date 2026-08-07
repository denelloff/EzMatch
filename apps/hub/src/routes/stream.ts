import type { FastifyReply, FastifyRequest } from 'fastify';
import type { HubApp } from '../app.js';
import { bus, type BusTopic } from '../bus.js';
import { db } from '../db.js';

const HEARTBEAT_MS = 25_000;

/**
 * Server-sent events rather than a WebSocket: the browser only ever consumes
 * here, and SSE reconnects on its own without extra client code.
 */
function openStream(
  request: FastifyRequest,
  reply: FastifyReply,
  topics: BusTopic[],
  onOpen?: (write: (event: string, data: unknown) => void) => void | Promise<void>,
): void {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Nginx buffers proxied responses by default, which would stall the stream.
    'X-Accel-Buffering': 'no',
  });

  const write = (event: string, data: unknown) => {
    if (reply.raw.writableEnded) return;
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const unsubscribes = topics.map((topic) =>
    bus.subscribe(topic, (data) => write('message', data)),
  );

  const heartbeat = setInterval(() => {
    if (reply.raw.writableEnded) return;
    reply.raw.write(': keep-alive\n\n');
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    for (const unsubscribe of unsubscribes) unsubscribe();
  };

  request.raw.on('close', cleanup);
  request.raw.on('error', cleanup);

  void Promise.resolve(onOpen?.(write)).catch(() => undefined);
}

export function registerStreamRoutes(app: HubApp): void {
  app.get<{ Params: { taskId: string } }>(
    '/internal/stream/task/:taskId',
    (request, reply) => {
      const { taskId } = request.params;
      openStream(request, reply, [`task:${taskId}`], async (write) => {
        const task = await db().task.findUnique({ where: { id: taskId } });
        if (task) {
          write('message', {
            taskId,
            status: task.status,
            phase: task.phase,
            percent: task.percent,
            message: task.message,
            error: task.error,
          });
        }
      });
    },
  );

  app.get<{ Params: { instanceId: string }; Querystring: { tail?: string } }>(
    '/internal/stream/console/:instanceId',
    (request, reply) => {
      const { instanceId } = request.params;
      const tail = Math.min(
        Number.parseInt(request.query.tail ?? '300', 10) || 300,
        2000,
      );

      openStream(request, reply, [`console:${instanceId}`], async (write) => {
        // Backfill first so a freshly opened tab is not blank until the server
        // happens to print something.
        const rows = await db().consoleLine.findMany({
          where: { instanceId },
          orderBy: { id: 'desc' },
          take: tail,
        });
        write(
          'backfill',
          rows
            .reverse()
            .map((row) => ({ ts: row.ts.toISOString(), line: row.line })),
        );
      });
    },
  );

  app.get<{ Params: { instanceId: string } }>(
    '/internal/stream/events/:instanceId',
    (request, reply) => {
      openStream(request, reply, [`events:${request.params.instanceId}`]);
    },
  );

  app.get<{ Params: { serverId: string } }>(
    '/internal/stream/server/:serverId',
    (request, reply) => {
      openStream(request, reply, [`server:${request.params.serverId}`]);
    },
  );

  app.get<{ Params: { instanceId: string } }>(
    '/internal/stream/instance/:instanceId',
    (request, reply) => {
      openStream(request, reply, [`instance:${request.params.instanceId}`]);
    },
  );

  app.get<{ Params: { matchId: string } }>(
    '/internal/stream/match/:matchId',
    (request, reply) => {
      openStream(request, reply, [`match:${request.params.matchId}`]);
    },
  );
}
