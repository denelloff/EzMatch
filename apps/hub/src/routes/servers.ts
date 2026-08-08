import { z } from 'zod';
import type { HubApp } from '../app.js';
import { agents, AgentOfflineError } from '../agent/registry.js';
import { bootstrapServer, waitForAgent } from '../bootstrap/index.js';
import type { HubConfig } from '../config.js';
import { db } from '../db.js';
import { logger } from '../logger.js';
import { createTask, failTask, isTaskCancelledError, updateTask } from '../tasks.js';

const AGENT_RECONNECT_MS = 90_000;

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

      // Drop the previous ERROR banner before the background job starts so the
      // panel never shows a stale failure next to a live install.
      await db().server.update({
        where: { id: server.id },
        data: { status: 'PENDING', lastError: null },
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

  /**
   * Pull the configured agent image on the host and recreate the container.
   * Requires an online agent that already speaks `agent.update` (no SSH).
   */
  app.post<{ Params: { serverId: string } }>(
    '/internal/servers/:serverId/update-agent',
    async (request, reply) => {
      const body = z
        .object({ createdById: z.string().max(64).nullable().optional() })
        .safeParse(request.body ?? {});
      if (!body.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: body.error.issues });
      }

      const server = await db().server.findUnique({
        where: { id: request.params.serverId },
      });
      if (!server) return reply.code(404).send({ error: 'not_found' });

      if (!agents.get(server.id)) {
        return reply.code(503).send({
          error: 'agent_offline',
          detail:
            'The agent is offline. Use Reinstall agent (SSH) once, then Update works without SSH.',
        });
      }

      const image = config.agent.image;
      const taskId = await createTask({
        serverId: server.id,
        type: 'server.agentUpdate',
        message: `Updating to ${image}`,
        createdById: body.data.createdById ?? null,
      });

      await db().server.update({
        where: { id: server.id },
        data: { status: 'PENDING', lastError: null },
      });

      void (async () => {
        try {
          await updateTask(taskId, {
            status: 'RUNNING',
            phase: 'pulling',
            percent: 5,
            message: `Asking the agent to pull ${image}`,
          });

          const connection = agents.get(server.id);
          if (!connection) {
            throw new AgentOfflineError(server.id);
          }

          await connection.dispatch({ type: 'agent.update', image }, taskId);

          await updateTask(taskId, {
            phase: 'restarting',
            percent: 85,
            message: 'Waiting for the new agent to connect…',
          });

          // Kick the pre-update socket and any quick reconnect of the old
          // container until the swap helper has replaced it.
          connection.close(1001, 'agent updating');
          agents.unregister(connection);
          await waitUntilAgentGone(server.id, 60_000);

          const connected = await waitForAgent(
            server.id,
            AGENT_RECONNECT_MS,
            (secondsLeft) => {
              void updateTask(taskId, {
                message: `Waiting for agent reconnect (${secondsLeft}s left)`,
              });
            },
          );

          if (!connected) {
            throw new Error(
              `Agent updated its image but did not reconnect within ${
                AGENT_RECONNECT_MS / 1000
              }s. Check docker logs on the host.`,
            );
          }

          await updateTask(taskId, {
            status: 'SUCCEEDED',
            phase: 'done',
            percent: 100,
            message: `Agent updated to ${image} and reconnected.`,
            error: null,
          });
        } catch (error) {
          if (isTaskCancelledError(error)) return;
          logger.error({ error, serverId: server.id }, 'agent update failed');
          await failTask(taskId, error);
          await db().server.update({
            where: { id: server.id },
            data: {
              status: agents.get(server.id) ? 'ONLINE' : 'ERROR',
              lastError:
                error instanceof Error ? error.message : 'Agent update failed',
            },
          });
        }
      })();

      return reply.send({ taskId, image });
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

/** Old container may reconnect until the swap helper stops it — keep kicking. */
async function waitUntilAgentGone(
  serverId: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = agents.get(serverId);
    if (!current) return;
    current.close(1001, 'agent update in progress');
    agents.unregister(current);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
}
