import { prisma } from '@/lib/db';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

const LEADERBOARD_SIZE = 25;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-xl tabular-nums text-ink-100">{value}</dd>
    </div>
  );
}

export default async function GlobalStatisticsPage() {

  const [matchCount, finishedCount, scores, playerTotals, killTotals] =
    await Promise.all([
      prisma.match.count(),
      prisma.match.count({ where: { state: 'FINISHED' } }),
      prisma.match.aggregate({ _sum: { team1Score: true, team2Score: true } }),
      prisma.matchPlayer.groupBy({
        by: ['steamId'],
        _sum: { kills: true, deaths: true, assists: true, damage: true },
        _count: { _all: true },
        orderBy: { _sum: { kills: 'desc' } },
        take: LEADERBOARD_SIZE,
      }),
      prisma.matchPlayer.aggregate({ _sum: { kills: true } }),
    ]);

  const rounds =
    (scores._sum.team1Score ?? 0) + (scores._sum.team2Score ?? 0);

  // groupBy cannot carry the display name, and a player may have used several,
  // so the most recent one wins.
  const names = new Map<string, string>();
  if (playerTotals.length > 0) {
    const recent = await prisma.matchPlayer.findMany({
      where: { steamId: { in: playerTotals.map((row) => row.steamId) } },
      select: { steamId: true, name: true },
      orderBy: { id: 'desc' },
    });
    for (const row of recent) {
      if (!names.has(row.steamId)) names.set(row.steamId, row.name);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">Global statistics</h1>
        <p className="mt-0.5 text-sm text-ink-400">
          Totals across every match this panel has run.
        </p>
      </div>

      <Card>
        <dl className="grid grid-cols-2 divide-x divide-ink-800 sm:grid-cols-4">
          <Stat label="Matches" value={matchCount} />
          <Stat label="Finished" value={finishedCount} />
          <Stat label="Rounds played" value={rounds} />
          <Stat label="Kills recorded" value={killTotals._sum.kills ?? 0} />
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Top players"
          description={`By total kills, across all matches. Showing up to ${LEADERBOARD_SIZE}.`}
        />
        {playerTotals.length === 0 ? (
          <EmptyState
            title="Nothing recorded yet"
            description="Player totals build up as matches are played on this panel."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-2 text-left font-normal">Player</th>
                <th className="px-3 py-2 text-right font-normal">Matches</th>
                <th className="px-3 py-2 text-right font-normal">K</th>
                <th className="px-3 py-2 text-right font-normal">D</th>
                <th className="px-3 py-2 text-right font-normal">A</th>
                <th className="px-5 py-2 text-right font-normal">K/D</th>
              </tr>
            </thead>
            <tbody>
              {playerTotals.map((row) => {
                const kills = row._sum.kills ?? 0;
                const deaths = row._sum.deaths ?? 0;
                return (
                  <tr key={row.steamId} className="border-t border-ink-800">
                    <td className="px-5 py-2 text-ink-200">
                      {names.get(row.steamId) ?? row.steamId}
                      <span className="ml-2 font-mono text-xs text-ink-400">
                        {row.steamId}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                      {row._count._all}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-100">
                      {kills}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                      {deaths}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                      {row._sum.assists ?? 0}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-ink-300">
                      {(deaths > 0 ? kills / deaths : kills).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

