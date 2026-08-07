import { loadMatchRows } from '@/lib/matches';
import { getT } from '@/lib/i18n';
import { MatchTable } from '@/components/match-table';

export const dynamic = 'force-dynamic';

/** Drafts and unfinished matches waiting for an operator. */
export default async function AdminMyMatchesPage() {
  const t = await getT();
  const rows = await loadMatchRows({
    state: { in: ['DRAFT', 'WARMUP', 'KNIFE', 'KNIFE_DECISION', 'PAUSED'] },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">{t.adminNavMyMatches}</h1>
        <p className="mt-0.5 text-sm text-ink-400">{t.homeDescription}</p>
      </div>
      <MatchTable
        rows={rows}
        linkInstances
        emptyTitle={t.archiveEmptyTitle}
        emptyDescription={t.archiveEmptyDescription}
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
