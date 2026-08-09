import { prisma } from '@/lib/db';
import { loadKills, weaponStats } from '@/lib/match-stats';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Weapon totals come from the raw kill events, which have no index by weapon.
 * The window keeps the query bounded instead of scanning the whole event table
 * as the panel accumulates history.
 */
const MATCH_WINDOW = 20;

export default async function WeaponStatisticsPage() {

  const matches = await prisma.match.findMany({
    where: { state: { in: ['FINISHED', 'CANCELLED'] } },
    orderBy: { createdAt: 'desc' },
    take: MATCH_WINDOW,
    select: { id: true },
  });

  const killBatches = await Promise.all(
    matches.map((match) => loadKills(match.id)),
  );
  const stats = weaponStats(killBatches.flat(), []);
  const totalKills = stats.reduce((sum, stat) => sum + stat.kills, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">Statistics by weapon</h1>
        <p className="mt-0.5 text-sm text-ink-400">
          Kills grouped by weapon across the last {MATCH_WINDOW} completed
          matches ({matches.length} available).
        </p>
      </div>

      <Card>
        {stats.length === 0 ? (
          <EmptyState
            title="No kills recorded"
            description="Weapon totals appear once matches have been played and their log streams stored."
          />
        ) : (
          <>
            <CardHeader
              title="Weapons"
              description={`${totalKills} kills across ${stats.length} weapons.`}
            />
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-2 text-left font-normal">Weapon</th>
                  <th className="px-3 py-2 text-right font-normal">Kills</th>
                  <th className="px-3 py-2 text-right font-normal">Share</th>
                  <th className="px-3 py-2 text-right font-normal">Headshots</th>
                  <th className="px-5 py-2 text-right font-normal">HS%</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr key={stat.weapon} className="border-t border-ink-800">
                    <td className="px-5 py-2 text-ink-200">
                      {stat.weapon.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-100">
                      {stat.kills}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                      {totalKills > 0
                        ? `${((stat.kills / totalKills) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                      {stat.headshots}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-ink-300">
                      {stat.kills > 0 ? `${stat.headshotPercent.toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
