import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';
import { shortMatchId } from '@/lib/matches';
import { MatchControls, type MatchSnapshot } from './match-controls';
import { MatchTabs } from './match-tabs';

export const dynamic = 'force-dynamic';

export default async function MatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: { instance: { select: { id: true, name: true } } },
  });
  if (!match) notFound();

  const snapshot: MatchSnapshot = {
    id: match.id,
    state: match.state,
    team1Name: match.team1Name,
    team2Name: match.team2Name,
    team1Score: match.team1Score,
    team2Score: match.team2Score,
    team1Side: match.team1Side,
    knifeRound: match.knifeRound,
    knifeWinner: match.knifeWinner,
    maxRounds: match.maxRounds,
    lastError: match.lastError,
  };

  const isAdmin = hasRole(user, 'ADMIN');

  return (
    <div className="space-y-6">
      <div>
        {isAdmin ? (
          <Link
            href={`/admin/instances/${match.instance.id}`}
            className="text-xs text-ink-400 hover:text-ink-200"
          >
            ← {match.instance.name}
          </Link>
        ) : (
          <Link href="/" className="text-xs text-ink-400 hover:text-ink-200">
            ← Matches
          </Link>
        )}
        <h1 className="mt-2 text-lg font-semibold text-ink-100">
          <span className="font-mono text-sm text-ink-400">
            #{shortMatchId(match.id)}
          </span>{' '}
          {match.title}
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          {match.map} · created {formatRelative(match.createdAt)}
          {match.startedAt ? ` · started ${formatRelative(match.startedAt)}` : ''}
        </p>
      </div>

      <MatchControls
        initial={snapshot}
        canOperate={hasRole(user, 'OPERATOR')}
        canAdmin={hasRole(user, 'ADMIN')}
      />

      <MatchTabs matchId={match.id} />

      {children}
    </div>
  );
}
