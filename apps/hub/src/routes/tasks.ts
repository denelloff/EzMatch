import type { HubApp } from '../app.js';
import { agents } from '../agent/registry.js';
import {
  cancelTask,
  TaskNotFoundError,
} from '../tasks.js';

export function registerTaskRoutes(app: HubApp): void {
  app.post<{ Params: { taskId: string } }>(
    '/internal/tasks/:taskId/cancel',
    async (request, reply) => {
      try {
        const result = await cancelTask(request.params.taskId);
        if (result.cancelled) {
          agents.get(result.serverId)?.cancel(request.params.taskId);
        }
        return reply.send({
          cancelled: result.cancelled,
          status: result.status,
        });
      } catch (error) {
        if (error instanceof TaskNotFoundError) {
          return reply.code(404).send({ error: 'not_found', detail: error.message });
        }
        throw error;
      }
    },
  );
}
