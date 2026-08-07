import Link from 'next/link';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { loadMatchRows } from '@/lib/matches';
import { LIVE_MATCH_STATES } from '@/lib/match-state';
import { getT } from '@/lib/i18n';
import { MatchTable } from '@/components/match-table';
import { Card, CardHeader, chipClass } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requireUser();
  const t = await getT();
  const isAdmin = hasRole(user, 'ADMIN');

  const [rows, running] = await Promise.all([
    loadMatchRows({ state: { in: ['DRAFT', ...LIVE_MATCH_STATES] } }),
    isAdmin
      ? prisma.gameInstance.findMany({
          where: { state: 'RUNNING' },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            startMap: true,
            server: { select: { name: true } },
            matches: {
              where: { state: { in: [...LIVE_MATCH_STATES] } },
              select: { id: true },
              take: 1,
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const idle = running.filter((instance) => instance.matches.length === 0);

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

      {isAdmin && idle.length > 0 ? (
        <Card>
          <CardHeader
            title={t.homeFreeServers}
            description={t.homeFreeServersDescription}
          />
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {idle.map((instance) => (
              <Link
                key={instance.id}
                href={`/admin/instances/${instance.id}/matches/new`}
                className={chipClass}
              >
                {instance.server.name} · {instance.name}
                <span className="ml-2 text-ink-400">{instance.startMap}</span>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
