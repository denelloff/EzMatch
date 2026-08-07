import { requireUser } from '@/lib/auth';
import { loadMatchRows } from '@/lib/matches';
import { getT } from '@/lib/i18n';
import { MatchTable } from '@/components/match-table';

export const dynamic = 'force-dynamic';

export default async function ArchivedMatchesPage() {
  await requireUser();
  const t = await getT();
  const rows = await loadMatchRows({}, 200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">{t.archiveTitle}</h1>
        <p className="mt-0.5 text-sm text-ink-400">{t.archiveDescription}</p>
      </div>

      <MatchTable
        rows={rows}
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
