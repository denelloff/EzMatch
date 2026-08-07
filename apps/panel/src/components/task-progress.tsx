'use client';

import { useEffect, useRef } from 'react';
import { Badge, Notice } from '@/components/ui';
import { useTaskStream } from '@/hooks/use-task-stream';

export function TaskProgress({
  taskId,
  title,
  onDone,
  logMaxHeightClass = 'max-h-56',
  waitingLabel = 'Waiting for install output…',
}: {
  taskId: string;
  title: string;
  onDone?: 'refresh';
  logMaxHeightClass?: string;
  waitingLabel?: string;
}) {
  const { update, log } = useTaskStream(taskId, onDone);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [log]);

  const status = update?.status ?? 'QUEUED';
  const percent = update?.percent ?? null;
  const tone =
    status === 'SUCCEEDED'
      ? 'ok'
      : status === 'FAILED' || status === 'TIMED_OUT'
        ? 'danger'
        : 'info';

  return (
    <div className="rounded-2xl border border-ink-700/80 bg-ink-900/85">
      <div className="flex items-center justify-between border-b border-ink-700/80 px-5 py-3">
        <div>
          <h2 className="text-sm font-medium text-ink-100">{title}</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            {update?.phase ?? 'queued'}
          </p>
        </div>
        <Badge tone={tone}>{status.toLowerCase()}</Badge>
      </div>

      <div className="px-5 py-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              tone === 'danger' ? 'bg-danger-500' : 'bg-brand-500'
            }`}
            style={{
              width:
                percent != null
                  ? `${percent}%`
                  : status === 'SUCCEEDED'
                    ? '100%'
                    : '10%',
            }}
          />
        </div>

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
