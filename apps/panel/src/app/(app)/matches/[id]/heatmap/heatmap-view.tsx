'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, checkboxClass, selectClass } from '@/components/ui';

export interface HeatPoint {
  x: number;
  y: number;
  /** Side of the player standing at this position. */
  side: string | null;
  role: 'killer' | 'victim';
  killer: string;
  victim: string;
  weapon: string | null;
  killerSteamId: string | null;
  victimSteamId: string | null;
}

export interface HeatPlayer {
  steamId: string;
  name: string;
}

const VIEW = 640;
const PADDING = 24;

export function HeatmapView({
  points,
  players,
  map,
}: {
  points: HeatPoint[];
  players: HeatPlayer[];
  map: string;
}) {
  const [showKillers, setShowKillers] = useState(true);
  const [showVictims, setShowVictims] = useState(true);
  const [side, setSide] = useState('all');
  const [player, setPlayer] = useState('all');

  const visible = useMemo(
    () =>
      points.filter((point) => {
        if (point.role === 'killer' && !showKillers) return false;
        if (point.role === 'victim' && !showVictims) return false;
        if (side !== 'all' && point.side !== side) return false;
        if (player !== 'all') {
          const owner =
            point.role === 'killer' ? point.killerSteamId : point.victimSteamId;
          if (owner !== player) return false;
        }
        return true;
      }),
    [points, showKillers, showVictims, side, player],
  );

  // The plot is fitted to the positions actually seen in this match, so it needs
  // no per-map calibration and works on workshop maps too.
  const bounds = useMemo(() => {
    if (points.length === 0) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const point of points) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const span = Math.max(width, height);
    return { minX, minY, width, height, span };
  }, [points]);

  const project = (point: HeatPoint) => {
    if (!bounds) return { cx: 0, cy: 0 };
    const usable = VIEW - PADDING * 2;
    // Centre the shorter axis so the map keeps its real proportions.
    const offsetX = (bounds.span - bounds.width) / 2;
    const offsetY = (bounds.span - bounds.height) / 2;
    const cx = PADDING + ((point.x - bounds.minX + offsetX) / bounds.span) * usable;
    // World Y grows north; SVG Y grows down.
    const cy =
      PADDING + ((bounds.span - (point.y - bounds.minY + offsetY)) / bounds.span) * usable;
    return { cx, cy };
  };

  return (
    <Card>
      <CardHeader
        title={`Kill positions · ${map}`}
        description={`${visible.length} of ${points.length} positions shown.`}
      />

      <div className="flex flex-wrap items-end gap-4 border-b border-ink-700 px-5 py-3">
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={showKillers}
            onChange={(event) => setShowKillers(event.target.checked)}
          />
          Killer positions
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={showVictims}
            onChange={(event) => setShowVictims(event.target.checked)}
          />
          Victim positions
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-ink-400">Side</span>
          <select
            className={`${selectClass} w-40`}
            value={side}
            onChange={(event) => setSide(event.target.value)}
          >
            <option value="all">Both sides</option>
            <option value="CT">CT</option>
            <option value="TERRORIST">T</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-ink-400">Player</span>
          <select
            className={`${selectClass} w-56`}
            value={player}
            onChange={(event) => setPlayer(event.target.value)}
          >
            <option value="all">All players</option>
            {players.map((entry) => (
              <option key={entry.steamId} value={entry.steamId}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="px-5 py-4">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="mx-auto block w-full max-w-2xl rounded-lg border border-ink-700 bg-ink-950"
          role="img"
          aria-label={`Kill positions on ${map}`}
        >
          {visible.map((point, index) => {
            const { cx, cy } = project(point);
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={point.role === 'killer' ? 5 : 4}
                fill={
                  point.role === 'killer'
                    ? 'var(--color-brand-500)'
                    : 'var(--color-danger-500)'
                }
                fillOpacity={0.35}
              >
                <title>
                  {point.killer} → {point.victim}
                  {point.weapon ? ` (${point.weapon})` : ''}
                </title>
              </circle>
            );
          })}
        </svg>

        <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-ink-400">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand-500 opacity-60" />
            where the killer stood
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-danger-500 opacity-60" />
            where the victim fell
          </span>
          <span>
            Positions are fitted to the coordinates seen in this match, not
            overlaid on the official radar.
          </span>
        </div>
      </div>
    </Card>
  );
}
