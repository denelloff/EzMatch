import { requireUser } from '@/lib/auth';
import { loadHits, loadKills, weaponStats } from '@/lib/match-stats';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

/** Log names are lowercase identifiers; only the underscores need cleaning up. */
function weaponLabel(weapon: string): string {
  return weapon.replace(/_/g, ' ');
}

export default async function WeaponStatisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [kills, hits] = await Promise.all([loadKills(id), loadHits(id)]);
  const stats = weaponStats(kills, hits);

  if (stats.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No weapon statistics yet"
          description="Kills and hits are read from the log stream. Nothing has been recorded for this match."
        />
      </Card>
    );
  }

  const topKills = Math.max(...stats.map((stat) => stat.kills), 1);
  const totalKills = stats.reduce((sum, stat) => sum + stat.kills, 0);
  const totalDamage = stats.reduce((sum, stat) => sum + stat.damage, 0);

  return (
    <Card>
      <CardHeader
        title="Weapon statistics"
        description={`${totalKills} kills and ${totalDamage.toLocaleString()} damage across ${stats.length} weapons.`}
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-400">
            <th className="px-5 py-2 text-left font-normal">Weapon</th>
            <th className="px-3 py-2 text-right font-normal">Kills</th>
            <th className="w-40 px-3 py-2 text-left font-normal">Share</th>
            <th className="px-3 py-2 text-right font-normal">HS</th>
            <th className="px-3 py-2 text-right font-normal">HS%</th>
            <th className="px-3 py-2 text-right font-normal">Hits</th>
            <th className="px-5 py-2 text-right font-normal">Damage</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.weapon} className="border-t border-ink-800">
              <td className="px-5 py-2 text-ink-200">{weaponLabel(stat.weapon)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-100">
                {stat.kills}
              </td>
              <td className="px-3 py-2">
                <div className="h-1.5 w-full rounded-full bg-ink-800">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: `${(stat.kills / topKills) * 100}%` }}
                  />
                </div>
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                {stat.headshots}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-300">
                {stat.kills > 0 ? `${stat.headshotPercent.toFixed(0)}%` : '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                {stat.hits}
              </td>
              <td className="px-5 py-2 text-right tabular-nums text-ink-300">
                {stat.damage.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

