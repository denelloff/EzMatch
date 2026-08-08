'use client';

import { useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Notice, secondaryButtonClass } from '@/components/ui';
import { useProgressEta } from '@/hooks/use-progress-eta';
import { useTaskStream } from '@/hooks/use-task-stream';
import { formatEta } from '@/lib/format';
import {
  cancelTaskAction,
  type CancelTaskState,
} from '@/app/admin/tasks/actions';

export function TaskProgress({
  taskId,
  title,
  onDone,
  logMaxHeightClass = 'max-h-56',
  waitingLabel = 'Waiting for install output…',
  etaLeftLabel = '~{eta} left',
  etaWaitLabel = 'Estimating time…',
  cancelLabel = 'Cancel',
  canCancel = true,
}: {
  taskId: string;
  title: string;
  onDone?: 'refresh';
  logMaxHeightClass?: string;
  waitingLabel?: string;
  etaLeftLabel?: string;
  etaWaitLabel?: string;
  cancelLabel?: string;
  canCancel?: boolean;
}) {
  const { update, log } = useTaskStream(taskId, onDone);
  const logRef = useRef<HTMLPreElement>(null);
  const [cancelState, cancelFormAction] = useActionState<CancelTaskState, FormData>(
    cancelTaskAction,
    { error: null, cancelled: null },
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [log]);

  useEffect(() => {
    if (cancelState.cancelled) {
      router.replace(pathname);
      router.refresh();
    }
  }, [cancelState.cancelled, router, pathname]);

  const status = update?.status ?? 'QUEUED';
  const percent = update?.percent ?? null;
  const running = status === 'RUNNING' || status === 'QUEUED';
  const displayPercent =
    percent != null
      ? Math.round(percent)
      : status === 'SUCCEEDED'
        ? 100
        : null;
  const etaMs = useProgressEta(percent, running);
  const tone =
    status === 'SUCCEEDED'
      ? 'ok'
      : status === 'FAILED' || status === 'TIMED_OUT' || status === 'CANCELLED'
        ? 'danger'
        : 'info';

  const etaText =
    status === 'SUCCEEDED'
      ? null
      : etaMs != null && etaMs > 0
        ? etaLeftLabel.replace('{eta}', formatEta(etaMs).replace(/^~/, ''))
        : running && displayPercent != null && displayPercent > 0
          ? etaWaitLabel
          : null;

  return (
    <div className="rounded-2xl border border-ink-700/80 bg-ink-900/85">
      <div className="flex items-center justify-between gap-3 border-b border-ink-700/80 px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-ink-100">{title}</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            {update?.phase ?? 'queued'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canCancel && running ? (
            <form action={cancelFormAction}>
              <input type="hidden" name="taskId" value={taskId} />
              <CancelButton label={cancelLabel} />
            </form>
          ) : null}
          <Badge tone={tone}>{status.toLowerCase()}</Badge>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
          <span className="font-medium tabular-nums text-ink-100">
            {displayPercent != null ? `${displayPercent}%` : '—'}
          </span>
          {etaText ? <span className="text-ink-400">{etaText}</span> : null}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              tone === 'danger' ? 'bg-danger-500' : 'bg-brand-500'
            }`}
            style={{
              width:
                displayPercent != null
                  ? `${displayPercent}%`
                  : status === 'SUCCEEDED'
                    ? '100%'
                    : '10%',
            }}
          />
        </div>

        {cancelState.error ? (
          <Notice tone="danger" className="mt-3">
            {cancelState.error}
          </Notice>
        ) : null}

        {update?.error ? (
          <Notice tone="danger" className="mt-3">
            {update.error}
          </Notice>
        ) : null}

        {log.length > 0 ? (
          <pre
            ref={logRef}
            className={`console-surface mt-3 ${logMaxHeightClass} overflow-auto rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs leading-relaxed text-ink-300`}
          >
            {log.join('\n')}
          </pre>
        ) : (
          <p className="mt-3 text-xs text-ink-500">{waitingLabel}</p>
        )}
      </div>
    </div>
  );
}

function CancelButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={secondaryButtonClass} disabled={pending}>
      {pending ? 'Cancelling…' : label}
    </button>
  );
}
