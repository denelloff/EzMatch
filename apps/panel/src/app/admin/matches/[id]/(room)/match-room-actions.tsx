'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import {
  Notice,
  buttonClass,
  dangerButtonClass,
  secondaryButtonClass,
} from '@/components/ui';
import {
  matchAction,
  type MatchActionState,
} from '@/app/(app)/matches/actions';

export interface MatchRoomActionSnapshot {
  id: string;
  state: string;
  team1Name: string;
  team2Name: string;
  knifeRound: boolean;
  streamersReady: boolean;
}

/** Primary match flow buttons — sit next to map / instance in the room header. */
export function MatchRoomActions({
  initial,
  canOperate,
  canAdmin,
}: {
  initial: MatchRoomActionSnapshot;
  canOperate: boolean;
  canAdmin: boolean;
}) {
  const [match, setMatch] = useState(initial);
  const [result, formAction] = useActionState<MatchActionState, FormData>(
    matchAction,
    { error: null, ok: false },
  );
  const router = useRouter();

  useEffect(() => setMatch(initial), [initial]);

  useEffect(() => {
    const source = new EventSource(`/api/stream/match/${initial.id}`);
    source.addEventListener('message', (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as {
        state?: string;
        streamersReady?: boolean;
      };
      if (data.state || data.streamersReady !== undefined) {
        setMatch((current) => ({
          ...current,
          ...(data.state ? { state: data.state } : {}),
          ...(data.streamersReady !== undefined
            ? { streamersReady: data.streamersReady }
            : {}),
        }));
        router.refresh();
      }
    });
    return () => source.close();
  }, [initial.id, router]);

  const done = match.state === 'FINISHED' || match.state === 'CANCELLED';
  if (done) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction} className="flex flex-wrap items-center justify-end gap-2">
        <input type="hidden" name="matchId" value={match.id} />

        {match.state === 'WARMUP' ? (
          match.streamersReady ? (
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
          )
        ) : null}

        {match.state === 'WARMUP' ? (
          match.knifeRound ? (
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
          )
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

        <Action
          name="cancel"
          label="Cancel match"
          className={dangerButtonClass}
          disabled={!canAdmin}
        />
      </form>
      {result.error ? (
        <Notice tone="danger">{result.error}</Notice>
      ) : null}
    </div>
  );
}

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
