'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui';

export interface ScoreboardPlayer {
  name: string;
  kills: number;
  assists: number;
  deaths: number;
  damage: number;
  connected: boolean;
  ready?: boolean;
}

export interface ScoreboardProps {
  matchId: string;
  map: string;
  state: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  team1Side: string;
  maxRounds: number;
  roundsPlayed: number;
  team1Players: ScoreboardPlayer[];
  team2Players: ScoreboardPlayer[];
  otherPlayers?: ScoreboardPlayer[];
  /** Slightly shorter board when the tool drawer is open. */
  compact?: boolean;
}

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

export function MatchScoreboard({
  matchId,
  map,
  state: initialState,
  team1Name,
  team2Name,
  team1Score: initialT1,
  team2Score: initialT2,
  team1Side,
  maxRounds,
  roundsPlayed,
  team1Players,
  team2Players,
  otherPlayers = [],
  compact = false,
}: ScoreboardProps) {
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
        players?: boolean;
      };
      if (data.state) setState(data.state);
      if (data.team1Score !== undefined) setTeam1Score(data.team1Score);
      if (data.team2Score !== undefined) setTeam2Score(data.team2Score);
      if (
        data.state ||
        data.team1Score !== undefined ||
        data.players
      ) {
        router.refresh();
      }
    });
    return () => source.close();
  }, [matchId, router]);

  const team1Ct = team1Side === 'CT';
  const round = team1Score + team2Score;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-ink-700/80 bg-ink-950 ${
        compact ? 'max-h-[42vh] overflow-y-auto' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800/90 px-5 py-4">
        <p className="text-sm text-ink-300">
          <span className="text-[10px] uppercase tracking-widest text-ink-500">
            Round
          </span>
          <span className="ml-2 font-medium text-ink-100">{round}</span>
          <span className="mx-2 text-ink-600">·</span>
          <span className="text-ink-100">{map}</span>
        </p>
        <div className="flex items-baseline gap-3 font-semibold tabular-nums tracking-tight">
          <span className="text-3xl text-sky-400 sm:text-4xl">{team1Score}</span>
          <span className="text-lg text-ink-600">:</span>
          <span className="text-3xl text-amber-400 sm:text-4xl">{team2Score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-ink-500">
            MR{maxRounds / 2}
          </span>
          <Badge tone={STATE_TONE[state] ?? 'neutral'}>
            {state.toLowerCase().replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <TeamBlock
        name={team1Name}
        side={team1Ct ? 'CT' : 'T'}
        tone="ct"
        players={team1Players}
        roundsPlayed={roundsPlayed}
        compact={compact}
      />

      <div className="border-y border-ink-800/80 bg-ink-900/50 px-5 py-2.5">
        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-ink-500">
          vs
        </p>
      </div>

      <TeamBlock
        name={team2Name}
        side={team1Ct ? 'T' : 'CT'}
        tone="t"
        players={team2Players}
        roundsPlayed={roundsPlayed}
        compact={compact}
      />

      {otherPlayers.length > 0 ? (
        <TeamBlock
          name="Unassigned / Spectators"
          side="—"
          tone="other"
          players={otherPlayers}
          roundsPlayed={roundsPlayed}
          compact={compact}
        />
      ) : null}
    </div>
  );
}

function TeamBlock({
  name,
  side,
  tone,
  players,
  roundsPlayed,
  compact,
}: {
  name: string;
  side: string;
  tone: 'ct' | 't' | 'other';
  players: ScoreboardPlayer[];
  roundsPlayed: number;
  compact: boolean;
}) {
  const header =
    tone === 'ct'
      ? 'bg-sky-500/15 text-sky-200'
      : tone === 't'
        ? 'bg-amber-500/15 text-amber-200'
        : 'bg-ink-700/50 text-ink-300';

  return (
    <div>
      <div className={`flex items-center justify-between px-5 py-2.5 ${header}`}>
        <p className="text-sm font-semibold tracking-wide">{name}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">{side}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-ink-500">
            <th className="px-5 py-2 text-left font-normal">Player</th>
            <th className="px-2 py-2 text-right font-normal">K</th>
            <th className="px-2 py-2 text-right font-normal">A</th>
            <th className="px-2 py-2 text-right font-normal">D</th>
            <th className="px-5 py-2 text-right font-normal">ADR</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className={`px-5 text-center text-xs text-ink-500 ${compact ? 'py-4' : 'py-8'}`}
              >
                Waiting for players…
              </td>
            </tr>
          ) : (
            players.map((player) => {
              const adr =
                roundsPlayed > 0
                  ? (player.damage / roundsPlayed).toFixed(1)
                  : '0.0';
              return (
                <tr
                  key={player.name}
                  className="border-t border-ink-800/60 text-ink-200"
                >
                  <td className={`px-5 ${compact ? 'py-1.5' : 'py-2.5'}`}>
                    <span
                      className={
                        player.connected ? 'text-ink-100' : 'text-ink-500'
                      }
                    >
                      {player.name}
                    </span>
                    {player.ready ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-400">
                        ready
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 text-right tabular-nums">{player.kills}</td>
                  <td className="px-2 text-right tabular-nums">{player.assists}</td>
                  <td className="px-2 text-right tabular-nums">{player.deaths}</td>
                  <td className="px-5 text-right tabular-nums text-ink-400">
                    {adr}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
