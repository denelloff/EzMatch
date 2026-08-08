import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';
import { getT } from '@/lib/i18n';
import { MatchPublicTabs } from './match-public-tabs';

export const dynamic = 'force-dynamic';

export default async function PublicMatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const t = await getT();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      instance: { select: { name: true } },
    },
  });
  if (!match) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <Link href="/" className="text-xs text-ink-400 hover:text-ink-200">
          ← {t.navMatches}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">
          <span className="font-mono text-sm text-ink-400">
            #{match.number}
          </span>{' '}
          {match.title}
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          {match.map} · {match.instance.name}
          {match.startedAt ? ` · started ${formatRelative(match.startedAt)}` : ''}
        </p>
      </div>

      <MatchPublicTabs
        matchId={match.id}
        labels={{
          scoreboard: t.matchTabScoreboard,
          stats: t.matchPublicTabStats,
          players: t.matchPublicTabPlayers,
          weapons: t.matchPublicTabWeapons,
          duels: t.matchPublicTabDuels,
          heatmap: t.matchPublicTabHeatmap,
          demos: t.matchPublicTabDemos,
        }}
      />

      {children}
    </div>
  );
}
