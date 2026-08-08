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
/** Blocks late agent progress from resurrecting a cancelled task (DB race + SSE). */
const cancelledTaskIds = new Set<string>();

export class TaskCancelledError extends Error {
  constructor(message = 'Cancelled by operator') {
    super(message);
    this.name = 'TaskCancelledError';
  }
}

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task ${taskId} was not found`);
    this.name = 'TaskNotFoundError';
  }
}

export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return (
    status === 'SUCCEEDED' ||
    status === 'FAILED' ||
    status === 'TIMED_OUT' ||
    status === 'CANCELLED'
  );
}

export function isTaskCancelledError(error: unknown): boolean {
  return (
    error instanceof TaskCancelledError ||
    (error instanceof Error && error.message === 'Cancelled by operator')
  );
}

export function isTaskCancelled(taskId: string): boolean {
  return cancelledTaskIds.has(taskId);
}

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

function publishTask(taskId: string, update: TaskUpdate): void {
  if (update.message) appendTaskLog(taskId, update.message);
  bus.publish(`task:${taskId}`, { taskId, ...update });
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

function isProgressUpdate(update: TaskUpdate): boolean {
  return update.status === 'RUNNING' || update.status == null;
}

export async function updateTask(
  taskId: string,
  update: TaskUpdate,
  options?: { persist?: boolean },
): Promise<void> {
  const persist = options?.persist !== false;
  const finished = update.status != null && isTerminalTaskStatus(update.status);

  // After cancel, drop progress and post-cancel success/failure noise.
  if (cancelledTaskIds.has(taskId) && !finished) {
    return;
  }
  if (cancelledTaskIds.has(taskId) && update.status && update.status !== 'CANCELLED') {
    return;
  }

  if (persist) {
    try {
      if (isProgressUpdate(update) && !finished) {
        const { count } = await db().task.updateMany({
          where: { id: taskId, status: { in: ['QUEUED', 'RUNNING'] } },
          data: {
            ...(update.status ? { status: update.status } : {}),
            ...(update.phase ? { phase: update.phase } : {}),
            ...(update.percent !== undefined ? { percent: update.percent } : {}),
            ...(update.message ? { message: update.message } : {}),
            ...(update.error !== undefined ? { error: update.error } : {}),
            ...(update.result !== undefined
              ? { result: update.result as object }
              : {}),
          },
        });
        // Terminal in DB (e.g. just cancelled) — do not fan out stale RUNNING.
        if (count === 0) return;
      } else {
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
      }
    } catch (error) {
      if (finished) throw error;
      logger.warn({ taskId, error }, 'Failed to persist task update');
    }
  } else if (isProgressUpdate(update)) {
    if (cancelledTaskIds.has(taskId)) return;
    const current = await db().task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    if (current && isTerminalTaskStatus(current.status)) return;
  }

  publishTask(taskId, update);

  if (finished) {
    setTimeout(() => {
      taskLogs.delete(taskId);
      cancelledTaskIds.delete(taskId);
    }, 5 * 60_000);
  }
}

export async function failTask(taskId: string, error: unknown): Promise<void> {
  if (cancelledTaskIds.has(taskId) || isTaskCancelledError(error)) {
    const current = await db().task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    if (current?.status === 'CANCELLED' || cancelledTaskIds.has(taskId)) return;
  }

  const message = error instanceof Error ? error.message : String(error);
  await updateTask(taskId, {
    status: 'FAILED',
    phase: 'failed',
    message,
    error: message,
  });
}

/**
 * Marks a QUEUED/RUNNING task cancelled. Caller should also
 * `agents.get(serverId)?.cancel(taskId)` so the agent aborts work.
 */
export async function cancelTask(
  taskId: string,
): Promise<{ cancelled: boolean; status: TaskStatus; serverId: string }> {
  const task = await db().task.findUnique({ where: { id: taskId } });
  if (!task) throw new TaskNotFoundError(taskId);

  if (isTerminalTaskStatus(task.status)) {
    return { cancelled: false, status: task.status, serverId: task.serverId };
  }

  // Mark first so concurrent taskProgress cannot win the race.
  cancelledTaskIds.add(taskId);

  const { count } = await db().task.updateMany({
    where: { id: taskId, status: { in: ['QUEUED', 'RUNNING'] } },
    data: {
      status: 'CANCELLED',
      phase: 'cancelled',
      message: 'Cancelled by operator',
      error: 'Cancelled by operator',
      finishedAt: new Date(),
    },
  });

  if (count === 0) {
    cancelledTaskIds.delete(taskId);
    const again = await db().task.findUnique({ where: { id: taskId } });
    return {
      cancelled: false,
      status: again?.status ?? task.status,
      serverId: task.serverId,
    };
  }

  publishTask(taskId, {
    status: 'CANCELLED',
    phase: 'cancelled',
    message: 'Cancelled by operator',
    error: 'Cancelled by operator',
  });

  setTimeout(() => {
    taskLogs.delete(taskId);
    cancelledTaskIds.delete(taskId);
  }, 5 * 60_000);

  return { cancelled: true, status: 'CANCELLED', serverId: task.serverId };
}
