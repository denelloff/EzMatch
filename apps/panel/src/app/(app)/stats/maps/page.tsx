import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function MapStatisticsPage() {
  await requireUser();

  const grouped = await prisma.match.groupBy({
    by: ['map'],
    _count: { _all: true },
    _sum: { team1Score: true, team2Score: true },
    orderBy: { _count: { map: 'desc' } },
  });

  const finished = await prisma.match.groupBy({
    by: ['map'],
    where: { state: 'FINISHED' },
    _count: { _all: true },
  });
  const finishedByMap = new Map(
    finished.map((row) => [row.map, row._count._all]),
  );

  const mostPlayed = Math.max(...grouped.map((row) => row._count._all), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">Statistics by map</h1>
        <p className="mt-0.5 text-sm text-ink-400">
          How often each map has been picked and how far those matches got.
        </p>
      </div>

      <Card>
        {grouped.length === 0 ? (
          <EmptyState
            title="No maps played"
            description="Every match records the map it was created for; this list fills in from there."
          />
        ) : (
          <>
            <CardHeader
              title="Maps"
              description={`${grouped.length} distinct maps played.`}
            />
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-2 text-left font-normal">Map</th>
                  <th className="px-3 py-2 text-right font-normal">Matches</th>
                  <th className="w-48 px-3 py-2 text-left font-normal">Share</th>
                  <th className="px-3 py-2 text-right font-normal">Finished</th>
                  <th className="px-3 py-2 text-right font-normal">Rounds</th>
                  <th className="px-5 py-2 text-right font-normal">Avg rounds</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row) => {
                  const matches = row._count._all;
                  const rounds =
                    (row._sum.team1Score ?? 0) + (row._sum.team2Score ?? 0);

                  return (
                    <tr key={row.map} className="border-t border-ink-800">
                      <td className="px-5 py-2 text-ink-200">{row.map}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-100">
                        {matches}
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-1.5 w-full rounded-full bg-ink-800">
                          <div
                            className="h-1.5 rounded-full bg-brand-500"
                            style={{ width: `${(matches / mostPlayed) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                        {finishedByMap.get(row.map) ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                        {rounds}
                      </td>
                      <td className="px-5 py-2 text-right tabular-nums text-ink-300">
                        {(rounds / matches).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
