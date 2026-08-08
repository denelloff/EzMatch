import type { Prisma } from '@ppanel/db';
import { prisma } from '@/lib/db';
import { connectCommand } from '@/lib/connect';
import { unseal } from '@/lib/secrets';
import type { MatchRow } from '@/components/match-table';

/** Human-facing match id: #1, #2, … */
export function formatMatchNumber(number: number): string {
  return String(number);
}

/** @deprecated Prefer formatMatchNumber(match.number). */
export function shortMatchId(id: string): string {
  return id.slice(-6).toUpperCase();
}

export async function loadMatchRows(
  where: Prisma.MatchWhereInput,
  take = 100,
): Promise<MatchRow[]> {
  const matches = await prisma.match.findMany({
    where,
    orderBy: [{ number: 'desc' }],
    take,
    include: {
      instance: {
        select: {
          id: true,
          name: true,
          gamePort: true,
          joinPasswordEnc: true,
          server: {
            select: { name: true, publicIp: true, host: true },
          },
        },
      },
    },
  });

  return matches.map((match) => {
    const host =
      match.instance.server.publicIp?.trim() || match.instance.server.host;
    const password =
      unseal(match.joinPasswordEnc) ||
      unseal(match.instance.joinPasswordEnc) ||
      null;

    return {
      id: match.id,
      number: match.number,
      shortId: formatMatchNumber(match.number),
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
      lastError: match.lastError,
      connect: connectCommand(host, match.instance.gamePort, password),
    };
  });
}
