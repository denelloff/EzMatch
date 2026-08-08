import { loadMatchRows } from '@/lib/matches';
import { getT } from '@/lib/i18n';
import { MyMatchesList } from '../my-matches-list';

export const dynamic = 'force-dynamic';

/** Drafts and in-progress matches the operator owns. */
export default async function AdminMyMatchesPage() {
  const t = await getT();
  const rows = await loadMatchRows({
    state: {
      in: [
        'DRAFT',
        'WARMUP',
        'KNIFE',
        'KNIFE_DECISION',
        'LIVE',
        'PAUSED',
        'HALFTIME',
        'OVERTIME',
      ],
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">{t.adminNavMyMatches}</h1>
        <p className="mt-0.5 text-sm text-ink-400">{t.myMatchesDescription}</p>
      </div>
      <MyMatchesList
        rows={rows}
        emptyTitle={t.myMatchesEmptyTitle}
        emptyDescription={t.myMatchesEmptyDescription}
        labels={{
          start: t.myMatchesStart,
          open: t.myMatchesOpen,
          edit: t.myMatchesEdit,
          delete: t.myMatchesDelete,
          restart: t.myMatchesRestart,
          duplicate: t.myMatchesDuplicate,
          connect: t.myMatchesConnect,
          copyConnect: t.matchCopyConnect,
          copiedConnect: t.matchCopiedConnect,
          colId: t.colId,
          colTeams: t.myMatchesColTeams,
          colMap: t.colMap,
          colServer: t.colServer,
          colStatus: t.colStatus,
          colActions: t.myMatchesColActions,
        }}
      />
    </div>
  );
}
