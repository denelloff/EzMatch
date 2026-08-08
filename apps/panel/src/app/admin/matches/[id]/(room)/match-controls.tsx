'use client';

import clsx from 'clsx';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import {
  Badge,
  Notice,
  chipClass,
  buttonClass,
  dangerButtonClass,
  secondaryButtonClass,
} from '@/components/ui';
import { listBackupsAction, matchAction, type MatchActionState } from '@/app/(app)/matches/actions';

export interface MatchSnapshot {
  id: string;
  state: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  team1Side: string;
  knifeRound: boolean;
  knifeWinner: number | null;
  maxRounds: number;
  lastError: string | null;
  streamersReady: boolean;
}

const STATE_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  DRAFT: 'neutral',
  WARMUP: 'info',
  KNIFE: 'warn',
  KNIFE_DECISION: 'warn',
  LIVE: 'ok',
  PAUSED: 'warn',
  HALFTIME: 'info',
  OVERTIME: 'ok',
  FINISHED: 'neutral',
  CANCELLED: 'neutral',
};

const STATE_HINT: Record<string, string> = {
  DRAFT:
    'Nothing has been sent to the server yet. Preparing applies the match convars and changes the map.',
  WARMUP:
    'Warmup is frozen so it will not end on its own. Start when both teams are in.',
  KNIFE: 'Knife round in progress. The winner picks a side when it ends.',
  KNIFE_DECISION: 'Waiting for the knife winner to choose a side.',
  LIVE: 'Match is live. The score comes from the server, not from eZ-Match counting rounds.',
  PAUSED: 'Paused. CS2 applies the pause at the end of the current round.',
  HALFTIME: 'Sides have swapped. The match resumes on the next round.',
  OVERTIME: 'Overtime. Same rules, shorter half.',
  FINISHED: 'Match finished.',
  CANCELLED: 'Match cancelled.',
};

export function MatchControls({
  initial,
  canOperate,
  canAdmin,
  embedded = false,
}: {
  initial: MatchSnapshot;
  canOperate: boolean;
  canAdmin: boolean;
  /** Drawer mode: actions only — scoreboard is already on the stage. */
  embedded?: boolean;
}) {
  const [match, setMatch] = useState(initial);
  const [result, formAction] = useActionState<MatchActionState, FormData>(matchAction, {
    error: null,
    ok: false,
  });
  const router = useRouter();

  useEffect(() => setMatch(initial), [initial]);

  useEffect(() => {
    const source = new EventSource(`/api/stream/match/${initial.id}`);

    source.addEventListener('message', (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as {
        state?: string;
        team1Score?: number;
        team2Score?: number;
        error?: string;
        streamersReady?: boolean;
      };

      setMatch((current) => ({
        ...current,
        ...(data.state ? { state: data.state } : {}),
        ...(data.team1Score !== undefined ? { team1Score: data.team1Score } : {}),
        ...(data.team2Score !== undefined ? { team2Score: data.team2Score } : {}),
        ...(data.error !== undefined ? { lastError: data.error } : {}),
        ...(data.streamersReady !== undefined
          ? { streamersReady: data.streamersReady }
          : {}),
      }));

      // A state change brings new transitions and player rows with it.
      if (data.state || data.streamersReady !== undefined) router.refresh();
    });

    return () => source.close();
  }, [initial.id, router]);

  const team1Ct = match.team1Side === 'CT';

  return (
    <div className="space-y-4">
      {!embedded ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border border-ink-700 bg-ink-900 px-6 py-5">
          <TeamScore
            name={match.team1Name}
            score={match.team1Score}
            side={team1Ct ? 'CT' : 'T'}
            align="right"
          />
          <div className="text-center">
            <Badge tone={STATE_TONE[match.state] ?? 'neutral'}>
              {match.state.toLowerCase().replace('_', ' ')}
            </Badge>
            <p className="mt-1 text-xs text-ink-500">MR{match.maxRounds / 2}</p>
          </div>
          <TeamScore
            name={match.team2Name}
            score={match.team2Score}
            side={team1Ct ? 'T' : 'CT'}
            align="left"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Badge tone={STATE_TONE[match.state] ?? 'neutral'}>
            {match.state.toLowerCase().replace(/_/g, ' ')}
          </Badge>
          <p className="text-sm text-ink-400">{STATE_HINT[match.state]}</p>
        </div>
      )}

      {!embedded ? (
        <p className="text-sm text-ink-400">{STATE_HINT[match.state]}</p>
      ) : null}

      {match.lastError ? <Notice tone="warn">{match.lastError}</Notice> : null}

      {result.error ? <Notice tone="danger">{result.error}</Notice> : null}

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="matchId" value={match.id} />

        {match.state === 'DRAFT' ? (
          <Action
            name="prepare"
            label="Prepare server"
            className={buttonClass}
            disabled={!canOperate}
          />
        ) : null}

        {match.state === 'WARMUP' ? (
          <>
            {match.streamersReady ? (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200">
                Streamers ready
              </span>
            ) : (
              <Action
                name="streamers_ready"
                label="Streamers ready"
                className={secondaryButtonClass}
                disabled={!canOperate}
              />
            )}
            {match.knifeRound ? (
              <Action
                name="knife"
                label="Start knife round"
                className={buttonClass}
                disabled={!canOperate}
              />
            ) : (
              <Action
                name="live"
                label="Go live"
                className={buttonClass}
                disabled={!canOperate}
              />
            )}
          </>
        ) : null}

        {match.state === 'KNIFE_DECISION' ? (
          <>
            <Action
              name="live:stay"
              label={`${match.team1Name} stays`}
              className={buttonClass}
              disabled={!canOperate}
            />
            <Action
              name="live:swap"
              label="Swap sides"
              className={secondaryButtonClass}
              disabled={!canOperate}
            />
          </>
        ) : null}

        {match.state === 'LIVE' || match.state === 'OVERTIME' ? (
          <Action
            name="pause"
            label="Pause"
            className={secondaryButtonClass}
            disabled={!canOperate}
          />
        ) : null}

        {match.state === 'PAUSED' ? (
          <Action
            name="unpause"
            label="Resume"
            className={buttonClass}
            disabled={!canOperate}
          />
        ) : null}

        {match.state !== 'FINISHED' && match.state !== 'CANCELLED' ? (
          <Action
            name="cancel"
            label="Cancel match"
            className={dangerButtonClass}
            disabled={!canAdmin}
          />
        ) : null}
      </form>

      {!embedded &&
      canAdmin &&
      match.state !== 'DRAFT' &&
      match.state !== 'CANCELLED' ? (
        <RestorePanel matchId={match.id} formAction={formAction} />
      ) : null}
    </div>
  );
}

function TeamScore({
  name,
  score,
  side,
  align,
}: {
  name: string;
  score: number;
  side: string;
  align: 'left' | 'right';
}) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <p className="truncate text-sm text-ink-300">{name}</p>
      <p className="text-3xl font-semibold text-ink-100 tabular-nums">{score}</p>
      <p className={`text-xs ${side === 'CT' ? 'text-brand-500' : 'text-warn-500'}`}>
        {side}
      </p>
    </div>
  );
}

/**
 * The knife decision needs two buttons that differ only in the side choice, and
 * a submit button carries a single name/value pair, so the choice rides along
 * in the action value as `live:swap`.
 */
function Action({
  name,
  label,
  className,
  disabled,
}: {
  name: string;
  label: string;
  className: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="action"
      value={name}
      className={className}
      disabled={disabled || pending}
    >
      {pending ? 'Working…' : label}
    </button>
  );
}

function RestorePanel({
  matchId,
  formAction,
}: {
  matchId: string;
  formAction: (formData: FormData) => void;
}) {
  const [files, setFiles] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-ink-100">Round backups</h3>
          <p className="mt-0.5 text-xs text-ink-400">
            Loads a round backup with mp_backup_restore_load_file, then pauses
            the match.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={loading}
          onClick={() =>
            startLoading(async () => {
              const response = await listBackupsAction(matchId);
              setFiles(response.files);
              setError(response.error);
            })
          }
        >
          {loading ? 'Reading…' : 'List backups'}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-danger-500">{error}</p> : null}

      {files ? (
        files.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">
            No backups yet. CS2 writes one at the start of each round once the
            match is live.
          </p>
        ) : (
          <form action={formAction} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="action" value="restore" />
            {files.map((file) => (
              <button
                key={file}
                type="submit"
                name="file"
                value={file}
                className={clsx('console-surface', chipClass)}
              >
                {file}
              </button>
            ))}
          </form>
        )
      ) : null}
    </div>
  );
}
