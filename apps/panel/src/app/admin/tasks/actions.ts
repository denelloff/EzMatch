'use server';

import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { hubFetch, HubError } from '@/lib/hub';

const schema = z.object({
  taskId: z.string().min(1).max(64),
});

export type CancelTaskState = {
  error: string | null;
  cancelled: boolean | null;
};

export async function cancelTaskAction(
  _prev: CancelTaskState,
  formData: FormData,
): Promise<CancelTaskState> {
  try {
    const user = await assertRole('OPERATOR');
    const parsed = schema.safeParse({
      taskId: formData.get('taskId'),
    });
    if (!parsed.success) {
      return { error: 'Invalid request', cancelled: null };
    }

    const result = await hubFetch<{ cancelled: boolean; status: string }>(
      `/internal/tasks/${parsed.data.taskId}/cancel`,
      { method: 'POST' },
    );

    await audit(user, 'task.cancel', 'task', parsed.data.taskId, {
      cancelled: result.cancelled,
      status: result.status,
    });

    return { error: null, cancelled: result.cancelled };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to cancel tasks.', cancelled: null };
    }
    if (error instanceof HubError) return { error: error.message, cancelled: null };
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      cancelled: null,
    };
  }
}
