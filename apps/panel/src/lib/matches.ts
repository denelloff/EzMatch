import type { Prisma } from '@ppanel/db';
import { prisma } from '@/lib/db';
import type { MatchRow } from '@/components/match-table';

/**
 * Matches are keyed by cuid, which is unreadable in a list. eBot numbers its
 * matches sequentially; MySQL only allows one auto-increment column per table,
 * so the tail of the cuid stands in as a short human-quotable handle.
 */
export function shortMatchId(id: string): string {
  return id.slice(-6).toUpperCase();
}

export async function loadMatchRows(
  where: Prisma.MatchWhereInput,
  take = 100,
): Promise<MatchRow[]> {
  const matches = await prisma.match.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      instance: {
        select: { id: true, name: true, server: { select: { name: true } } },
      },
    },
  });

  return matches.map((match) => ({
    id: match.id,
    shortId: shortMatchId(match.id),
    title: match.title,
    state: match.state,
    map: match.map,
    team1Name: match.team1Name,
    team2Name: match.team2Name,
    team1Score: match.team1Score,
    team2Score: match.team2Score,
    instanceId: match.instance.id,
    instanceName: match.instance.name,
    serverName: match.instance.server.name,
  }));
}
