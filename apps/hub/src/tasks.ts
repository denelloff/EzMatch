import { db } from './db.js';
import { bus } from './bus.js';
import { logger } from './logger.js';
import type { TaskStatus } from '@ppanel/db';

export interface TaskUpdate {
  status?: TaskStatus;
  phase?: string;
  percent?: number | null;
  message?: string;
  error?: string | null;
  result?: unknown;
}

const MAX_TASK_LOG_LINES = 1_000;
const taskLogs = new Map<string, string[]>();

/** In-memory console for a running task — backfilled when an SSE client connects. */
export function getTaskLog(taskId: string): string[] {
  return taskLogs.get(taskId) ?? [];
}

function appendTaskLog(taskId: string, message: string): void {
  const lines = taskLogs.get(taskId) ?? [];
  if (lines[lines.length - 1] === message) return;
  lines.push(message);
  if (lines.length > MAX_TASK_LOG_LINES) {
    lines.splice(0, lines.length - MAX_TASK_LOG_LINES);
  }
  taskLogs.set(taskId, lines);
}

export async function createTask(input: {
  serverId: string;
  instanceId?: string | null;
  type: string;
  message?: string;
  createdById?: string | null;
}): Promise<string> {
  const task = await db().task.create({
    data: {
      serverId: input.serverId,
      instanceId: input.instanceId ?? null,
      type: input.type,
      message: input.message ?? 'Queued',
      createdById: input.createdById ?? null,
    },
  });
  publishTask(task.id, {
    status: task.status,
    phase: task.phase,
    percent: task.percent,
    message: task.message,
  });
  return task.id;
}

export async function updateTask(
  taskId: string,
  update: TaskUpdate,
  options?: { persist?: boolean },
): Promise<void> {
  const persist = options?.persist !== false;
  const finished =
    update.status === 'SUCCEEDED' ||
    update.status === 'FAILED' ||
    update.status === 'TIMED_OUT';

  if (persist) {
    try {
      await db().task.update({
        where: { id: taskId },
        data: {
          ...(update.status ? { status: update.status } : {}),
          ...(update.phase ? { phase: update.phase } : {}),
          ...(update.percent !== undefined ? { percent: update.percent } : {}),
          ...(update.message ? { message: update.message } : {}),
          ...(update.error !== undefined ? { error: update.error } : {}),
          ...(update.result !== undefined
            ? { result: update.result as object }
            : {}),
          ...(finished ? { finishedAt: new Date() } : {}),
        },
      });
    } catch (error) {
      // A task row disappearing mid-flight must not take down the operation that
      // was reporting progress on it.
      logger.warn({ taskId, error }, 'Failed to persist task update');
    }
  }

  publishTask(taskId, update);

  if (finished) {
    // Keep logs briefly for the final SSE backfill, then drop.
    setTimeout(() => taskLogs.delete(taskId), 5 * 60_000);
  }
}

function publishTask(taskId: string, update: TaskUpdate): void {
  if (update.message) appendTaskLog(taskId, update.message);
  bus.publish(`task:${taskId}`, { taskId, ...update });
}

export async function failTask(taskId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await updateTask(taskId, {
    status: 'FAILED',
    phase: 'failed',
    message,
    error: message,
  });
}
