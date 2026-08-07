'use client';

import { useEffect, useRef } from 'react';
import { Badge, Notice } from '@/components/ui';
import { useTaskStream } from '@/hooks/use-task-stream';

function phaseLabel(
  phase: string | undefined,
  labels: DeployAgentLabels,
): string {
  switch (phase) {
    case 'preflight':
      return labels.phasePreflight;
    case 'docker':
      return labels.phaseDocker;
    case 'disk':
      return labels.phaseDisk;
    case 'network':
      return labels.phaseNetwork;
    case 'credentials':
      return labels.phaseCredentials;
    case 'agent':
      return labels.phaseAgent;
    case 'done':
      return labels.phaseDone;
    case 'queued':
    case undefined:
      return labels.phaseQueued;
    default:
      return phase;
  }
}

function statusLabel(status: string, labels: DeployAgentLabels): string {
  switch (status) {
    case 'SUCCEEDED':
      return labels.taskSucceeded;
    case 'FAILED':
      return labels.taskFailed;
    case 'TIMED_OUT':
      return labels.taskTimedOut;
    case 'RUNNING':
      return labels.taskRunning;
    case 'QUEUED':
      return labels.taskQueued;
    default:
      return status.toLowerCase();
  }
}

export interface DeployAgentLabels {
  title: string;
  waiting: string;
  consoleTitle: string;
  consoleHint: string;
  live: string;
  ended: string;
  phaseQueued: string;
  phasePreflight: string;
  phaseDocker: string;
  phaseDisk: string;
  phaseNetwork: string;
  phaseCredentials: string;
  phaseAgent: string;
  phaseDone: string;
  taskSucceeded: string;
  taskFailed: string;
  taskTimedOut: string;
  taskRunning: string;
  taskQueued: string;
}

export function DeployAgentPanel({
  taskId,
  labels,
}: {
  taskId: string;
  labels: DeployAgentLabels;
}) {
  const { update, log, live } = useTaskStream(taskId, 'refresh');
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink-700/80 bg-ink-900/85 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
        <div className="flex items-center justify-between border-b border-ink-700/80 px-5 py-3">
          <div>
            <h2
              className="text-sm font-semibold tracking-tight text-ink-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {labels.title}
            </h2>
            <p className="mt-0.5 text-xs text-ink-400">
              {phaseLabel(update?.phase, labels)}
            </p>
          </div>
          <Badge tone={tone}>{statusLabel(status, labels)}</Badge>
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
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-700/80 bg-ink-950 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
        <div className="flex items-center justify-between gap-3 border-b border-ink-700/80 bg-ink-900/80 px-5 py-3">
          <div className="min-w-0">
            <h2
              className="text-sm font-semibold tracking-tight text-ink-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {labels.consoleTitle}
            </h2>
            <p className="mt-0.5 truncate text-xs text-ink-400">
              {labels.consoleHint}
            </p>
          </div>
          <span
            className={`shrink-0 text-[11px] font-medium tracking-wide ${
              live ? 'text-ok-500' : 'text-ink-400'
            }`}
          >
            {live ? labels.live : labels.ended}
          </span>
        </div>

        <pre
          ref={logRef}
          className="console-surface max-h-[28rem] min-h-64 overflow-auto px-4 py-3 text-[12px] leading-relaxed text-ink-300"
        >
          {log.length > 0 ? log.join('\n') : labels.waiting}
        </pre>
      </div>
    </div>
  );
}
