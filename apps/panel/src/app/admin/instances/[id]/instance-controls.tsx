'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { TaskProgress } from '@/components/task-progress';
import {
  Notice,
  buttonClass,
  dangerButtonClass,
  secondaryButtonClass,
} from '@/components/ui';
import { DeleteInstanceButton } from '@/app/admin/instances/delete-instance-button';
import { instanceLifecycleAction, type LifecycleState } from './actions';

const TASK_TITLE: Record<string, string> = {
  start: 'Starting the server',
  stop: 'Stopping the server',
  restart: 'Restarting the server',
  update: 'Updating CS2',
  reconfigure: 'Applying server settings',
};

export function InstanceControls({
  instanceId,
  state,
  canOperate,
  canAdmin,
  updateWarning,
  deleteLabel,
}: {
  instanceId: string;
  state: string;
  canOperate: boolean;
  canAdmin: boolean;
  updateWarning: string | null;
  deleteLabel: string;
}) {
  const [result, formAction] = useActionState<LifecycleState, FormData>(
    instanceLifecycleAction,
    { error: null, taskId: null },
  );
  // Only used to label the progress panel once a task comes back.
  const [action, setAction] = useState<string>('start');
  const [confirmingUpdate, setConfirmingUpdate] = useState(false);

  const running = state === 'RUNNING';
  const busy = ['CREATING', 'INSTALLING', 'STARTING', 'STOPPING', 'UPDATING'].includes(
    state,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="instanceId" value={instanceId} />

        {running ? (
          <>
            <Button
              action="restart"
              label="Restart"
              className={secondaryButtonClass}
              disabled={!canOperate || busy}
              onSelect={setAction}
            />
            <Button
              action="stop"
              label="Stop"
              className={secondaryButtonClass}
              disabled={!canOperate || busy}
              onSelect={setAction}
            />
          </>
        ) : (
          <Button
            action="start"
            label="Start"
            className={buttonClass}
            disabled={!canOperate || busy || state === 'REMOVED'}
            onSelect={setAction}
          />
        )}

        {confirmingUpdate ? (
          <Button
            action="update"
            label="Yes, update CS2"
            className={dangerButtonClass}
            disabled={!canAdmin || busy}
            onSelect={setAction}
          />
        ) : null}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {!confirmingUpdate ? (
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!canAdmin || busy}
            onClick={() => setConfirmingUpdate(true)}
          >
            Update CS2…
          </button>
        ) : (
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setConfirmingUpdate(false)}
          >
            Cancel update
          </button>
        )}

        {canAdmin && state !== 'REMOVED' ? (
          <DeleteInstanceButton instanceId={instanceId} label={deleteLabel} />
        ) : null}
      </div>

      {confirmingUpdate ? (
        <Notice tone="warn">
          {updateWarning ??
            'Updating pulls whatever build Valve published. Metamod and CounterStrikeSharp link against the game binaries and regularly stop loading after a patch, which takes the server down until a newer plugin build is pinned.'}
        </Notice>
      ) : null}

      {result.error ? <Notice tone="danger">{result.error}</Notice> : null}

      {result.taskId ? (
        <TaskProgress
          key={result.taskId}
          taskId={result.taskId}
          title={TASK_TITLE[action] ?? 'Working'}
          onDone="refresh"
        />
      ) : null}
    </div>
  );
}

/**
 * The submitted action comes from the button's own value rather than a hidden
 * input driven by state, which would still hold the previous action at the
 * moment the form serializes.
 */
function Button({
  action,
  label,
  className,
  disabled,
  onSelect,
}: {
  action: string;
  label: string;
  className: string;
  disabled: boolean;
  onSelect: (action: string) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="action"
      value={action}
      className={className}
      disabled={disabled || pending}
      onClick={() => onSelect(action)}
    >
      {label}
    </button>
  );
}
