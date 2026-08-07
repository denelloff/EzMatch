import { z } from 'zod';
import type { HubApp } from '../app.js';
import { AgentOfflineError } from '../agent/registry.js';
import { matches, MatchError } from '../match/runner.js';

const actionBody = z.object({
  action: z.enum([
    'prepare',
    'knife',
    'live',
    'pause',
    'unpause',
    'restore',
    'cancel',
  ]),
  choice: z.enum(['stay', 'swap']).optional(),
  file: z.string().max(128).optional(),
});

export function registerMatchRoutes(app: HubApp): void {
  app.post<{ Params: { matchId: string } }>(
    '/internal/matches/:matchId/action',
    async (request, reply) => {
      const parsed = actionBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', detail: parsed.error.issues });
      }
      const { matchId } = request.params;
      const body = parsed.data;

      try {
        switch (body.action) {
          case 'prepare':
            await matches.prepare(matchId);
            break;
          case 'knife':
            await matches.startKnife(matchId);
            break;
          case 'live':
            if (body.choice) {
              await matches.decideKnife(matchId, body.choice);
            } else {
              await matches.goLive(matchId);
            }
            break;
          case 'pause':
            await matches.pause(matchId);
            break;
          case 'unpause':
            await matches.unpause(matchId);
            break;
          case 'restore':
            if (!body.file) {
              return reply.code(400).send({ error: 'invalid_body', detail: 'file is required' });
            }
            await matches.restore(matchId, body.file);
            break;
          case 'cancel':
            await matches.cancel(matchId);
            break;
        }
        return reply.send({ ok: true });
      } catch (error) {
        return reply.code(statusFor(error)).send({
          error: error instanceof MatchError ? 'invalid_state' : 'command_failed',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  app.get<{ Params: { matchId: string } }>(
    '/internal/matches/:matchId/backups',
    async (request, reply) => {
      try {
        return reply.send({ files: await matches.listBackups(request.params.matchId) });
      } catch (error) {
        return reply.code(statusFor(error)).send({
          error: 'command_failed',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  app.post<{ Params: { matchId: string } }>(
    '/internal/matches/:matchId/demos/sync',
    async (request, reply) => {
      try {
        return reply.send({ indexed: await matches.syncDemos(request.params.matchId) });
      } catch (error) {
        return reply.code(statusFor(error)).send({
          error: 'command_failed',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );
}

function statusFor(error: unknown): number {
  if (error instanceof MatchError) return 409;
  if (error instanceof AgentOfflineError) return 503;
  return 502;
}
