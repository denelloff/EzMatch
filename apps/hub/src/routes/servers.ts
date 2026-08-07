import { z } from 'zod';
import type { HubApp } from '../app.js';
import { bootstrapServer } from '../bootstrap/index.js';
import type { HubConfig } from '../config.js';
import { db } from '../db.js';
import { logger } from '../logger.js';
import { createTask } from '../tasks.js';
import { agents } from '../agent/registry.js';

const bootstrapBody = z.object({
  username: z.string().min(1).max(64),
  password: z.string().max(1024).optional(),
  privateKey: z.string().max(64 * 1024).optional(),
  passphrase: z.string().max(1024).optional(),
  expectedHostKey: z.string().max(256).optional(),
  createdById: z.string().max(64).nullable().optional(),
});

export function registerServerRoutes(app: HubApp, config: HubConfig): void {
  app.post<{ Params: { serverId: string } }>(
    '/internal/servers/:serverId/bootstrap',
    async (request, reply) => {
      const parsed = bootstrapBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: parsed.error.issues });
      }
      const body = parsed.data;
      if (!body.password && !body.privateKey) {
        return reply
          .code(400)
          .send({ error: 'invalid_body', detail: 'Provide a password or a private key' });
      }

      const server = await db().server.findUnique({
        where: { id: request.params.serverId },
      });
      if (!server) return reply.code(404).send({ error: 'not_found' });

      const taskId = await createTask({
        serverId: server.id,
        type: 'server.bootstrap',
        message: 'Queued',
        createdById: body.createdById ?? null,
      });

      // Deliberately not awaited: bootstrap installs Docker and pulls an image,
      // which takes minutes. The caller follows the task stream instead.
      void bootstrapServer({
        serverId: server.id,
        taskId,
        agentConfig: config.agent,
        credentials: {
          host: server.host,
          port: server.sshPort,
          username: body.username,
          ...(body.password ? { password: body.password } : {}),
          ...(body.privateKey ? { privateKey: body.privateKey } : {}),
          ...(body.passphrase ? { passphrase: body.passphrase } : {}),
          ...(body.expectedHostKey ? { expectedHostKey: body.expectedHostKey } : {}),
        },
      }).catch((error: unknown) => {
        logger.error({ error, serverId: server.id }, 'bootstrap crashed');
      });

      return reply.send({ taskId });
    },
  );

  app.get('/internal/agents', async () => {
    return {
      connected: agents.all().map((connection) => ({
        serverId: connection.serverId,
        agentVersion: connection.agentVersion,
        lastSeenAt: new Date(connection.lastSeenAt).toISOString(),
        instances: connection.instances.length,
      })),
    };
  });

  app.post<{ Params: { serverId: string } }>(
    '/internal/servers/:serverId/revoke-token',
    async (request, reply) => {
      const { serverId } = request.params;
      await db().agentToken.updateMany({
        where: { serverId },
        data: { revokedAt: new Date() },
      });
      agents.get(serverId)?.close(4401, 'token revoked');
      await db().server.update({
        where: { id: serverId },
        data: { status: 'OFFLINE' },
      });
      return reply.send({ ok: true });
    },
  );
}
