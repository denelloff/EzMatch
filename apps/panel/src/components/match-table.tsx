'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { MatchState } from '@ppanel/db';
import { Badge, EmptyState, checkboxClass, chipClass } from '@/components/ui';
import { STATE_LABEL, STATE_TONE, formatScore, isLiveState } from '@/lib/match-state';

export interface MatchRow {
  id: string;
  shortId: string;
  title: string;
  state: MatchState;
  map: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  instanceId: string;
  instanceName: string;
  serverName: string;
}

export interface MatchTableLabels {
  displayScores: string;
  liveRefresh: string;
  liveRefreshEvery: string;
  scoreHidden: string;
  show: string;
  colId: string;
  colTeam1: string;
  colScore: string;
  colTeam2: string;
  colMap: string;
  colServer: string;
  colStatus: string;
}

const REFRESH_INTERVAL_MS = 10_000;

export function MatchTable({
  rows,
  emptyTitle,
  emptyDescription,
  labels,
  defaultLiveRefresh = false,
  /** When set, the server column becomes a link into the admin instance page. */
  linkInstances = false,
}: {
  rows: MatchRow[];
  emptyTitle: string;
  emptyDescription: string;
  labels: MatchTableLabels;
  /** Only the in-progress list polls by default; the archive never changes. */
  defaultLiveRefresh?: boolean;
  linkInstances?: boolean;
}) {
  const router = useRouter();
  const [showScores, setShowScores] = useState(true);
  const [liveRefresh, setLiveRefresh] = useState(defaultLiveRefresh);

  useEffect(() => {
    if (!liveRefresh) return;
    const timer = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [liveRefresh, router]);

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900">
      <div className="flex flex-wrap items-center gap-5 border-b border-ink-700 px-5 py-3">
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={showScores}
            onChange={(event) => setShowScores(event.target.checked)}
          />
          {labels.displayScores}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={liveRefresh}
            onChange={(event) => setLiveRefresh(event.target.checked)}
          />
          {labels.liveRefresh}
          <span className="text-xs text-ink-400">{labels.liveRefreshEvery}</span>
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-400">
              <th className="px-5 py-2.5 text-left font-normal">{labels.colId}</th>
              <th className="px-3 py-2.5 text-right font-normal">
                {labels.colTeam1}
              </th>
              <th className="px-3 py-2.5 text-center font-normal">
                {labels.colScore}
              </th>
              <th className="px-3 py-2.5 text-left font-normal">
                {labels.colTeam2}
              </th>
              <th className="px-3 py-2.5 text-left font-normal">{labels.colMap}</th>
              <th className="px-3 py-2.5 text-left font-normal">
                {labels.colServer}
              </th>
              <th className="px-3 py-2.5 text-left font-normal">
                {labels.colStatus}
              </th>
              <th className="px-5 py-2.5 text-right font-normal" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const team1Leads = row.team1Score > row.team2Score;
              const team2Leads = row.team2Score > row.team1Score;
              const serverLabel = `${row.serverName} · ${row.instanceName}`;

              return (
                <tr
                  key={row.id}
                  className="border-t border-ink-800 transition-colors hover:bg-ink-850"
                >
                  <td className="px-5 py-2.5 font-mono text-xs text-ink-400">
                    #{row.shortId}
                  </td>
                  <td
                    className={clsx(
                      'max-w-48 truncate px-3 py-2.5 text-right',
                      team1Leads ? 'text-ink-100' : 'text-ink-300',
                    )}
                  >
                    {row.team1Name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center tabular-nums">
                    {showScores ? (
                      <span className="text-ink-100">
                        {formatScore(row.team1Score)}
                        <span className="px-1 text-ink-400">-</span>
                        {formatScore(row.team2Score)}
                      </span>
                    ) : (
                      <span className="text-ink-400">{labels.scoreHidden}</span>
                    )}
                  </td>
                  <td
                    className={clsx(
                      'max-w-48 truncate px-3 py-2.5',
                      team2Leads ? 'text-ink-100' : 'text-ink-300',
                    )}
                  >
                    {row.team2Name}
                  </td>
                  <td className="px-3 py-2.5 text-ink-300">{row.map}</td>
                  <td className="max-w-40 truncate px-3 py-2.5 text-xs text-ink-400">
                    {linkInstances ? (
                      <Link
                        href={`/admin/instances/${row.instanceId}`}
                        className="hover:text-brand-500"
                      >
                        {serverLabel}
                      </Link>
                    ) : (
                      serverLabel
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={STATE_TONE[row.state]}>
                      {isLiveState(row.state) ? (
                        <span className="size-1.5 rounded-full bg-current" />
                      ) : null}
                      {STATE_LABEL[row.state]}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Link href={`/matches/${row.id}`} className={chipClass}>
                      {labels.show}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
