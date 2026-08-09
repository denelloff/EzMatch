import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { duelMatrix, loadKills } from '@/lib/match-stats';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function DuelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: { team1Name: true, team2Name: true, players: true },
  });
  if (!match) notFound();

  const kills = await loadKills(id);
  const { players, counts } = duelMatrix(
    match.players.map((player) => ({
      steamId: player.steamId,
      name: player.name,
      team: player.team,
      connected: player.connected,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      damage: player.damage,
    })),
    kills,
  );

  if (players.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No duels recorded"
          description="The matrix is built from kill events, which start arriving once the match is live."
        />
      </Card>
    );
  }

  const peak = Math.max(...counts.flat(), 1);
  const teamName = (team: number) =>
    team === 1 ? match.team1Name : team === 2 ? match.team2Name : 'unassigned';

  return (
    <Card>
      <CardHeader
        title="Killer / Killed"
        description="Rows kill columns. Read across a row to see who that player beat, down a column to see who kept beating them."
      />
      <div className="overflow-x-auto px-5 py-4">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-ink-900 px-2 py-1 text-left text-xs font-normal text-ink-400">
                Killer \ Killed
              </th>
              {players.map((player) => (
                <th
                  key={player.steamId}
                  className="px-1 py-1 text-xs font-normal text-ink-400"
                >
                  <div className="mx-auto h-24 w-6">
                    <span className="block origin-bottom-left translate-x-6 rotate-180 whitespace-nowrap [writing-mode:vertical-rl]">
                      {player.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((killer, row) => (
              <tr key={killer.steamId} className="border-t border-ink-800">
                <td className="sticky left-0 max-w-48 truncate bg-ink-900 px-2 py-1.5 text-ink-200">
                  {killer.name}
                  <span className="ml-2 text-xs text-ink-400">
                    {teamName(killer.team)}
                  </span>
                </td>
                {players.map((victim, column) => {
                  const value = counts[row][column];
                  const self = row === column;

                  return (
                    <td
                      key={victim.steamId}
                      title={`${killer.name} → ${victim.name}: ${value}`}
                      className="px-1 py-1.5 text-center tabular-nums"
                      style={
                        value > 0
                          ? {
                              backgroundColor: `color-mix(in srgb, var(--color-brand-500) ${
                                20 + (value / peak) * 60
                              }%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className={
                          self
                            ? 'text-ink-600'
                            : value > 0
                              ? 'text-ink-100'
                              : 'text-ink-600'
                        }
                      >
                        {self ? '·' : value || '·'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

