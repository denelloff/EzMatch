'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui';

const STATE_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
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

/** Sticky broadcast strip — always-visible live score above the tool tabs. */
export function LiveScoreStrip({
  matchId,
  team1Name,
  team2Name,
  team1Score: initialT1,
  team2Score: initialT2,
  state: initialState,
  map,
  maxRounds,
  team1Side,
}: {
  matchId: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  state: string;
  map: string;
  maxRounds: number;
  team1Side: string;
}) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [team1Score, setTeam1Score] = useState(initialT1);
  const [team2Score, setTeam2Score] = useState(initialT2);

  useEffect(() => {
    setState(initialState);
    setTeam1Score(initialT1);
    setTeam2Score(initialT2);
  }, [initialState, initialT1, initialT2]);

  useEffect(() => {
    const source = new EventSource(`/api/stream/match/${matchId}`);
    source.addEventListener('message', (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as {
        state?: string;
        team1Score?: number;
        team2Score?: number;
      };
      if (data.state) setState(data.state);
      if (data.team1Score !== undefined) setTeam1Score(data.team1Score);
      if (data.team2Score !== undefined) setTeam2Score(data.team2Score);
      if (data.state || data.team1Score !== undefined) router.refresh();
    });
    return () => source.close();
  }, [matchId, router]);

  const team1Ct = team1Side === 'CT';
  const round = team1Score + team2Score;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-700/90 bg-ink-950">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 sm:px-4">
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-semibold text-ink-100">{team1Name}</p>
          <p
            className={`text-[10px] uppercase tracking-[0.18em] ${
              team1Ct ? 'text-sky-400' : 'text-amber-400'
            }`}
          >
            {team1Ct ? 'CT' : 'T'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-0.5 px-2">
          <div className="flex items-baseline gap-2 font-semibold tabular-nums tracking-tight">
            <span className="text-2xl text-sky-400 sm:text-3xl">{team1Score}</span>
            <span className="text-base text-ink-600">:</span>
            <span className="text-2xl text-amber-400 sm:text-3xl">{team2Score}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge tone={STATE_TONE[state] ?? 'neutral'}>
              {state.toLowerCase().replace(/_/g, ' ')}
            </Badge>
            <span className="text-[10px] uppercase tracking-widest text-ink-500">
              R{round} · {map} · MR{maxRounds / 2}
            </span>
          </div>
        </div>

        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-ink-100">{team2Name}</p>
          <p
            className={`text-[10px] uppercase tracking-[0.18em] ${
              team1Ct ? 'text-amber-400' : 'text-sky-400'
            }`}
          >
            {team1Ct ? 'T' : 'CT'}
          </p>
        </div>
      </div>
    </div>
  );
}
