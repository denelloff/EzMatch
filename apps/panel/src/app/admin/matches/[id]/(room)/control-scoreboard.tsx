'use client';

import clsx from 'clsx';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Notice,
  buttonClass,
  dangerButtonClass,
  secondaryButtonClass,
} from '@/components/ui';
import { moderateMatchPlayerAction } from '@/app/(app)/matches/actions';

export interface ModeratablePlayer {
  steamId: string;
  name: string;
  kills: number;
  assists: number;
  deaths: number;
  damage: number;
  connected: boolean;
  ready?: boolean;
}

export function ControlScoreboard({
  matchId,
  instanceId,
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
  canKick,
  canBan,
}: {
  matchId: string;
  instanceId: string;
  map: string;
  state: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  team1Side: string;
  maxRounds: number;
  roundsPlayed: number;
  team1Players: ModeratablePlayer[];
  team2Players: ModeratablePlayer[];
  otherPlayers?: ModeratablePlayer[];
  canKick: boolean;
  canBan: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [team1Score, setTeam1Score] = useState(initialT1);
  const [team2Score, setTeam2Score] = useState(initialT2);
  const [selected, setSelected] = useState<ModeratablePlayer | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

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

  const run = (action: 'kick' | 'ban') => {
    if (!selected) return;
    setMessage(null);
    setError(null);
    startBusy(async () => {
      const result = await moderateMatchPlayerAction({
        matchId,
        instanceId,
        steamId: selected.steamId,
        name: selected.name,
        action,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        action === 'kick'
          ? `Kicked ${selected.name}`
          : `Banned ${selected.name}`,
      );
      setSelected(null);
      router.refresh();
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-ink-700/80 bg-ink-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-800/90 px-4 py-2.5">
        <p className="text-xs text-ink-400">
          <span className="uppercase tracking-widest text-ink-500">R</span>{' '}
          <span className="text-ink-100">{round}</span>
          <span className="mx-1.5 text-ink-600">·</span>
          {map}
        </p>
        <div className="flex items-baseline gap-2 font-semibold tabular-nums">
          <span className="text-xl text-sky-400">{team1Score}</span>
          <span className="text-ink-600">:</span>
          <span className="text-xl text-amber-400">{team2Score}</span>
        </div>
        <Badge tone="neutral">MR{maxRounds / 2} · {state.toLowerCase()}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TeamBlock
          name={team1Name}
          side={team1Ct ? 'CT' : 'T'}
          tone="ct"
          players={team1Players}
          roundsPlayed={roundsPlayed}
          selectedId={selected?.steamId ?? null}
          onSelect={setSelected}
        />
        <div className="border-y border-ink-800/80 bg-ink-900/40 px-4 py-1.5 text-center text-[10px] uppercase tracking-[0.25em] text-ink-500">
          vs
        </div>
        <TeamBlock
          name={team2Name}
          side={team1Ct ? 'T' : 'CT'}
          tone="t"
          players={team2Players}
          roundsPlayed={roundsPlayed}
          selectedId={selected?.steamId ?? null}
          onSelect={setSelected}
        />
        {otherPlayers.length > 0 ? (
          <TeamBlock
            name="Unassigned / Spectators"
            side="—"
            tone="other"
            players={otherPlayers}
            roundsPlayed={roundsPlayed}
            selectedId={selected?.steamId ?? null}
            onSelect={setSelected}
          />
        ) : null}
      </div>

      <div className="border-t border-ink-800/90 px-4 py-3">
        {selected ? (
          <div className="space-y-2">
            <p className="text-sm text-ink-200">
              Selected{' '}
              <span className="font-medium text-ink-100">{selected.name}</span>
              <span className="ml-2 font-mono text-[10px] text-ink-500">
                {selected.steamId}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                disabled={!canKick || busy}
                onClick={() => run('kick')}
              >
                Kick
              </button>
              <button
                type="button"
                className={dangerButtonClass}
                disabled={!canBan || busy}
                onClick={() => run('ban')}
                title={canBan ? 'Permanent banid + kick' : 'Admin only'}
              >
                Ban
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-500">
            Select a player to kick or ban.
          </p>
        )}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {message ? <Notice tone="info">{message}</Notice> : null}
      </div>
    </div>
  );
}

function TeamBlock({
  name,
  side,
  tone,
  players,
  roundsPlayed,
  selectedId,
  onSelect,
}: {
  name: string;
  side: string;
  tone: 'ct' | 't' | 'other';
  players: ModeratablePlayer[];
  roundsPlayed: number;
  selectedId: string | null;
  onSelect: (player: ModeratablePlayer) => void;
}) {
  const header =
    tone === 'ct'
      ? 'bg-sky-500/15 text-sky-200'
      : tone === 't'
        ? 'bg-amber-500/15 text-amber-200'
        : 'bg-ink-700/50 text-ink-300';

  return (
    <div>
      <div className={`flex items-center justify-between px-4 py-2 ${header}`}>
        <p className="text-sm font-semibold tracking-wide">{name}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">{side}</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-ink-500">
            <th className="px-4 py-1.5 text-left font-normal">Player</th>
            <th className="px-2 py-1.5 text-right font-normal">K</th>
            <th className="px-2 py-1.5 text-right font-normal">A</th>
            <th className="px-2 py-1.5 text-right font-normal">D</th>
            <th className="px-4 py-1.5 text-right font-normal">ADR</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-xs text-ink-500">
                Waiting for players…
              </td>
            </tr>
          ) : (
            players.map((player) => {
              const adr =
                roundsPlayed > 0
                  ? (player.damage / roundsPlayed).toFixed(1)
                  : '0.0';
              const active = selectedId === player.steamId;
              return (
                <tr
                  key={player.steamId}
                  className={clsx(
                    'cursor-pointer border-t border-ink-800/60 transition',
                    active
                      ? 'bg-brand-500/15 text-ink-100'
                      : 'text-ink-200 hover:bg-ink-900/80',
                  )}
                  onClick={() => onSelect(player)}
                >
                  <td className="px-4 py-2">
                    <span
                      className={
                        player.connected ? 'text-inherit' : 'text-ink-500'
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
                  <td className="px-4 text-right tabular-nums text-ink-400">
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
