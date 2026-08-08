'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { MatchState } from '@ppanel/db';
import { Badge, EmptyState, Notice } from '@/components/ui';
import { CopyConnectButton } from '@/components/copy-connect-button';
import { STATE_LABEL, STATE_TONE, formatScore, isLiveState } from '@/lib/match-state';
import type { MatchRow } from '@/components/match-table';
import {
  deleteMatchAction,
  duplicateMatchAction,
  restartMatchAction,
  startMatchAction,
  type MatchManageState,
} from './manage-actions';

const actionBtn =
  'inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50';

const primaryAction = clsx(
  actionBtn,
  'bg-gradient-to-b from-brand-500 to-brand-600 text-ink-950 shadow-[0_1px_0_rgba(255,255,255,0.18)_inset] hover:brightness-110',
);

const quietAction = clsx(
  actionBtn,
  'border border-ink-600/80 bg-ink-850/90 text-ink-200 hover:border-ink-400 hover:bg-ink-800 hover:text-ink-100',
);

const dangerAction = clsx(
  actionBtn,
  'border border-danger-500/35 bg-danger-500/10 text-danger-500 hover:border-danger-500/55 hover:bg-danger-500/18',
);

export function MyMatchesList({
  rows,
  emptyTitle,
  emptyDescription,
  labels,
}: {
  rows: MatchRow[];
  emptyTitle: string;
  emptyDescription: string;
  labels: {
    start: string;
    open: string;
    edit: string;
    delete: string;
    restart: string;
    duplicate: string;
    connect: string;
    copyConnect: string;
    copiedConnect: string;
    colId: string;
    colTeams: string;
    colMap: string;
    colServer: string;
    colStatus: string;
    colActions: string;
  };
}) {
  const [startState, startAction] = useActionState<MatchManageState, FormData>(
    startMatchAction,
    { error: null, ok: false },
  );
  const [restartState, restartAction] = useActionState<MatchManageState, FormData>(
    restartMatchAction,
    { error: null, ok: false },
  );
  const [deleteState, deleteAction] = useActionState<MatchManageState, FormData>(
    deleteMatchAction,
    { error: null, ok: false },
  );
  const [dupState, dupAction] = useActionState<MatchManageState, FormData>(
    duplicateMatchAction,
    { error: null, ok: false },
  );

  const flash = startState.error || restartState.error || deleteState.error || dupState.error;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-ink-700 bg-ink-900">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flash ? <Notice tone="danger">{flash}</Notice> : null}
      {startState.ok || restartState.ok ? (
        <Notice tone="info">Server config applied — match is in warmup.</Notice>
      ) : null}

      <ul className="space-y-2.5">
        {rows.map((row) => (
          <MatchCard
            key={row.id}
            row={row}
            labels={labels}
            startAction={startAction}
            restartAction={restartAction}
            deleteAction={deleteAction}
            dupAction={dupAction}
          />
        ))}
      </ul>
    </div>
  );
}

function MatchCard({
  row,
  labels,
  startAction,
  restartAction,
  deleteAction,
  dupAction,
}: {
  row: MatchRow;
  labels: {
    start: string;
    open: string;
    edit: string;
    delete: string;
    restart: string;
    duplicate: string;
    copyConnect: string;
    copiedConnect: string;
  };
  startAction: (payload: FormData) => void;
  restartAction: (payload: FormData) => void;
  deleteAction: (payload: FormData) => void;
  dupAction: (payload: FormData) => void;
}) {
  const canOpen = row.state !== 'DRAFT' && row.state !== 'CANCELLED' && row.state !== 'FINISHED';
  const canStart = row.state === 'DRAFT';
  const canEdit = row.state === 'DRAFT';
  const canDelete = row.state === 'DRAFT' || row.state === 'CANCELLED';
  const canRestart =
    row.state === 'DRAFT' ||
    row.state === 'WARMUP' ||
    row.state === 'KNIFE' ||
    row.state === 'KNIFE_DECISION';

  return (
    <li className="rounded-xl border border-ink-700/90 bg-ink-900/90 px-4 py-3.5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-ink-600/80 bg-ink-850 px-2 font-mono text-xs font-semibold tabular-nums text-ink-200">
              #{row.number}
            </span>
            <p className="text-sm font-semibold text-ink-100">
              {row.team1Name}{' '}
              <span className="font-normal text-ink-500">vs</span> {row.team2Name}
            </p>
            <Badge tone={STATE_TONE[row.state as MatchState]}>
              {isLiveState(row.state) ? (
                <span className="size-1.5 rounded-full bg-current" />
              ) : null}
              {STATE_LABEL[row.state as MatchState]}
            </Badge>
          </div>

          <p className="mt-1.5 text-xs text-ink-400">
            <span className="tabular-nums text-ink-300">
              {formatScore(row.team1Score)}-{formatScore(row.team2Score)}
            </span>
            <span className="mx-1.5 text-ink-600">·</span>
            {row.title}
            <span className="mx-1.5 text-ink-600">·</span>
            {row.map}
            <span className="mx-1.5 text-ink-600">·</span>
            <Link
              href={`/admin/instances/${row.instanceId}`}
              className="hover:text-brand-500"
            >
              {row.serverName} · {row.instanceName}
            </Link>
          </p>

          {row.lastError ? (
            <p className="mt-1.5 max-w-2xl text-xs text-danger-500">{row.lastError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {canStart ? (
            <form action={startAction}>
              <input type="hidden" name="matchId" value={row.id} />
              <BusyButton className={primaryAction} label={labels.start} />
            </form>
          ) : null}

          {canOpen ? (
            <Link href={`/admin/matches/${row.id}/control`} className={primaryAction}>
              {labels.open}
            </Link>
          ) : (
            <span className={clsx(quietAction, 'opacity-40')} title="Start the match first">
              {labels.open}
            </span>
          )}

          {canEdit ? (
            <Link href={`/admin/matches/${row.id}/edit`} className={quietAction}>
              {labels.edit}
            </Link>
          ) : null}

          {canRestart ? (
            <form action={restartAction}>
              <input type="hidden" name="matchId" value={row.id} />
              <BusyButton className={quietAction} label={labels.restart} />
            </form>
          ) : null}

          <form action={dupAction}>
            <input type="hidden" name="matchId" value={row.id} />
            <BusyButton className={quietAction} label={labels.duplicate} />
          </form>

          {canDelete ? (
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!window.confirm(`${labels.delete}?`)) event.preventDefault();
              }}
            >
              <input type="hidden" name="matchId" value={row.id} />
              <BusyButton className={dangerAction} label={labels.delete} />
            </form>
          ) : null}
        </div>
      </div>

      {row.connect ? (
        <div className="mt-3 flex justify-end border-t border-ink-800/80 pt-3">
          <CopyConnectButton
            connect={row.connect}
            copyLabel={labels.copyConnect}
            copiedLabel={labels.copiedConnect}
            compact
            className="w-full max-w-md"
          />
        </div>
      ) : null}
    </li>
  );
}

function BusyButton({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? '…' : label}
    </button>
  );
}
