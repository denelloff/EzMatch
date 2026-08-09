import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { loadKills, playerStats, type PlayerStat } from '@/lib/match-stats';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

function TeamTable({ title, players }: { title: string; players: PlayerStat[] }) {
  return (
    <Card>
      <CardHeader title={title} description={`${players.length} players`} />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-400">
            <th className="px-5 py-2 text-left font-normal">Player</th>
            <th className="px-3 py-2 text-right font-normal">K</th>
            <th className="px-3 py-2 text-right font-normal">D</th>
            <th className="px-3 py-2 text-right font-normal">A</th>
            <th className="px-3 py-2 text-right font-normal">+/−</th>
            <th className="px-3 py-2 text-right font-normal">K/D</th>
            <th className="px-3 py-2 text-right font-normal">HS%</th>
            <th className="px-5 py-2 text-right font-normal">ADR</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.steamId}
              className={`border-t border-ink-800 ${player.connected ? '' : 'opacity-50'}`}
            >
              <td className="max-w-56 truncate px-5 py-2 text-ink-200">
                {player.name}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-100">
                {player.kills}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                {player.deaths}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                {player.assists}
              </td>
              <td
                className={`px-3 py-2 text-right tabular-nums ${
                  player.diff > 0
                    ? 'text-ok-500'
                    : player.diff < 0
                      ? 'text-danger-500'
                      : 'text-ink-400'
                }`}
              >
                {player.diff > 0 ? `+${player.diff}` : player.diff}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-300">
                {player.kdr.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-300">
                {player.headshotPercent.toFixed(0)}%
              </td>
              <td className="px-5 py-2 text-right tabular-nums text-ink-300">
                {player.adr.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default async function PlayerStatisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      team1Name: true,
      team2Name: true,
      team1Score: true,
      team2Score: true,
      players: true,
    },
  });
  if (!match) notFound();

  const kills = await loadKills(id);
  const stats = playerStats(
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
    match.team1Score + match.team2Score,
  );

  if (stats.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No player statistics yet"
          description="Rows appear once the match goes live and the log stream starts reporting kills and damage."
        />
      </Card>
    );
  }

  const team1 = stats.filter((player) => player.team === 1);
  const team2 = stats.filter((player) => player.team === 2);
  const unassigned = stats.filter((player) => player.team !== 1 && player.team !== 2);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-400">
        ADR is damage divided by rounds played. HS% counts headshot kills against
        that player&apos;s total kills, both taken from the log stream.
      </p>

      {team1.length > 0 ? <TeamTable title={match.team1Name} players={team1} /> : null}
      {team2.length > 0 ? <TeamTable title={match.team2Name} players={team2} /> : null}
      {unassigned.length > 0 ? (
        <TeamTable title="Unassigned" players={unassigned} />
      ) : null}
    </div>
  );
}

