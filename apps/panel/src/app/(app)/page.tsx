import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { loadMatchRows } from '@/lib/matches';
import { LIVE_MATCH_STATES } from '@/lib/match-state';
import { getT } from '@/lib/i18n';
import { MatchTable } from '@/components/match-table';

export const dynamic = 'force-dynamic';

/** Public home: live scoreboard list only — no match/server management. */
export default async function HomePage() {
  await requireUser();
  const t = await getT();

  const rows = await loadMatchRows({
    state: { in: [...LIVE_MATCH_STATES] },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-100">{t.homeTitle}</h1>
          <p className="mt-0.5 text-sm text-ink-400">{t.homeDescription}</p>
        </div>
        <Link
          href="/matches"
          className="text-sm text-ink-400 hover:text-brand-500"
        >
          {t.homeAllMatches}
        </Link>
      </div>

      <MatchTable
        rows={rows}
        defaultLiveRefresh
        emptyTitle={t.homeEmptyTitle}
        emptyDescription={t.homeEmptyDescription}
        labels={{
          displayScores: t.displayScores,
          liveRefresh: t.liveRefresh,
          liveRefreshEvery: t.liveRefreshEvery,
          scoreHidden: t.scoreHidden,
          show: t.show,
          colId: t.colId,
          colTeam1: t.colTeam1,
          colScore: t.colScore,
          colTeam2: t.colTeam2,
          colMap: t.colMap,
          colServer: t.colServer,
          colStatus: t.colStatus,
        }}
      />
    </div>
  );
}
