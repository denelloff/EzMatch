import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { loadKills } from '@/lib/match-stats';
import { Card, EmptyState } from '@/components/ui';
import { HeatmapView, type HeatPlayer, type HeatPoint } from './heatmap-view';

export const dynamic = 'force-dynamic';

export default async function HeatmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      map: true,
      players: { select: { steamId: true, name: true }, orderBy: { name: 'asc' } },
    },
  });
  if (!match) notFound();

  const kills = await loadKills(id);
  const points: HeatPoint[] = [];

  for (const kill of kills) {
    const base = {
      killer: kill.killerName ?? 'unknown',
      victim: kill.victimName ?? 'unknown',
      weapon: kill.weapon,
      killerSteamId: kill.killerSteamId,
      victimSteamId: kill.victimSteamId,
    };
    if (kill.killerPos && !kill.selfInflicted) {
      points.push({
        ...base,
        x: kill.killerPos[0],
        y: kill.killerPos[1],
        side: kill.killerSide,
        role: 'killer',
      });
    }
    if (kill.victimPos) {
      points.push({
        ...base,
        x: kill.victimPos[0],
        y: kill.victimPos[1],
        side: kill.victimSide,
        role: 'victim',
      });
    }
  }

  if (points.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No positions recorded"
          description="Kill coordinates come from the log stream. Either the match has no kills yet, or mp_logdetail is not high enough for the server to print positions."
        />
      </Card>
    );
  }

  const players: HeatPlayer[] = match.players;

  return <HeatmapView points={points} players={players} map={match.map} />;
}

