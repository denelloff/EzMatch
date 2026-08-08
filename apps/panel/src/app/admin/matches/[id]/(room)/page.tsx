import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { scoreboardPlayersVisible } from '@/lib/scoreboard-players';
import { MatchScoreboard } from './scoreboard-view';

export const dynamic = 'force-dynamic';

export default async function AdminMatchScoreboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('OPERATOR');
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
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
    name: p.name,
    kills: p.kills,
    assists: p.assists,
    deaths: p.deaths,
    damage: p.damage,
    connected: p.connected,
    ready: p.ready,
  });

  return (
    <MatchScoreboard
      matchId={match.id}
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
    />
  );
}
