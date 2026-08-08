import { notFound } from 'next/navigation';
import { hasRole, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { scoreboardPlayersVisible } from '@/lib/scoreboard-players';
import { ConsoleView } from '@/app/admin/instances/[id]/console-view';
import { ControlScoreboard } from '../control-scoreboard';

export const dynamic = 'force-dynamic';

export default async function AdminMatchControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole('OPERATOR');
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      instance: { select: { id: true, state: true } },
      players: { orderBy: [{ team: 'asc' }, { kills: 'desc' }] },
    },
  });
  if (!match) notFound();

  const visible = match.players.filter((p) =>
    scoreboardPlayersVisible(match.state, p.connected),
  );
  const team1 = visible.filter((p) => p.team === 1);
  const team2 = visible.filter((p) => p.team === 2);
  const other = visible.filter((p) => p.team !== 1 && p.team !== 2);
  const roundsPlayed = match.team1Score + match.team2Score;
  const mapPlayer = (p: (typeof match.players)[number]) => ({
    steamId: p.steamId,
    name: p.name,
    kills: p.kills,
    assists: p.assists,
    deaths: p.deaths,
    damage: p.damage,
    connected: p.connected,
    ready: p.ready,
  });

  return (
    <div className="-m-3 grid h-full min-h-0 grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
      <div className="min-h-0 border-b border-ink-700/80 lg:border-b-0 lg:border-r">
        <div className="h-full min-h-0 overflow-hidden p-2.5 sm:p-3">
          <ConsoleView
            instanceId={match.instance.id}
            canSend={hasRole(user, 'OPERATOR')}
            running={match.instance.state === 'RUNNING'}
            embedded
          />
        </div>
      </div>

      <div className="min-h-0 overflow-hidden p-2.5 sm:p-3">
        <ControlScoreboard
          matchId={match.id}
          instanceId={match.instance.id}
          map={match.map}
          state={match.state}
          team1Name={match.team1Name}
          team2Name={match.team2Name}
          team1Score={match.team1Score}
          team2Score={match.team2Score}
          team1Side={match.team1Side}
          maxRounds={match.maxRounds}
          roundsPlayed={roundsPlayed}
          team1Players={team1.map(mapPlayer)}
          team2Players={team2.map(mapPlayer)}
          otherPlayers={other.map(mapPlayer)}
          canKick={hasRole(user, 'OPERATOR')}
          canBan={hasRole(user, 'ADMIN')}
        />
      </div>
    </div>
  );
}
