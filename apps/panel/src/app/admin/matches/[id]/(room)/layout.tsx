import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { hasRole, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { connectCommand } from '@/lib/connect';
import { formatRelative } from '@/lib/format';
import { getT } from '@/lib/i18n';
import { unseal } from '@/lib/secrets';
import { CopyConnectButton } from '@/components/copy-connect-button';
import { LiveScoreStrip } from './live-score-strip';
import { MatchRoomActions } from './match-room-actions';
import { MatchTabs } from './match-tabs';

export const dynamic = 'force-dynamic';

export default async function AdminMatchRoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole('OPERATOR');
  const t = await getT();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      instance: {
        select: {
          id: true,
          name: true,
          gamePort: true,
          joinPasswordEnc: true,
          server: { select: { publicIp: true, host: true } },
        },
      },
    },
  });
  if (!match) notFound();

  if (match.state === 'DRAFT') {
    redirect('/admin/matches/mine');
  }

  const isAdmin = hasRole(user, 'ADMIN');
  const host =
    match.instance.server.publicIp?.trim() || match.instance.server.host;
  const password =
    unseal(match.joinPasswordEnc) ||
    unseal(match.instance.joinPasswordEnc) ||
    null;
  const connect = connectCommand(host, match.instance.gamePort, password);

  return (
    <div className="mx-auto flex h-[calc(100dvh-5.5rem)] max-w-7xl flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin/matches/mine"
            className="text-xs text-ink-400 hover:text-ink-200"
          >
            ← {t.adminNavMyMatches}
          </Link>
          <h1 className="mt-1 text-base font-semibold text-ink-100">
            <span className="font-mono text-sm text-ink-400">#{match.number}</span>{' '}
            {match.title}
          </h1>
          <p className="mt-0.5 text-xs text-ink-400">
            {match.map} · {match.instance.name}
            {match.startedAt ? ` · started ${formatRelative(match.startedAt)}` : ''}
            {isAdmin ? (
              <>
                {' · '}
                <Link
                  href={`/admin/instances/${match.instance.id}`}
                  className="hover:text-brand-500"
                >
                  instance
                </Link>
                {' · '}
                <Link
                  href={`/admin/matches/${match.id}/edit`}
                  className="hover:text-brand-500"
                >
                  {t.myMatchesEdit}
                </Link>
              </>
            ) : null}
          </p>
        </div>

        <div className="ml-auto flex max-w-full flex-col items-end gap-2">
          <MatchRoomActions
            initial={{
              id: match.id,
              state: match.state,
              team1Name: match.team1Name,
              team2Name: match.team2Name,
              knifeRound: match.knifeRound,
              knifeWinner: match.knifeWinner,
              streamersReady: match.streamersReady,
            }}
            canOperate={hasRole(user, 'OPERATOR')}
            canAdmin={isAdmin}
          />
          <CopyConnectButton
            connect={connect}
            copyLabel={t.matchCopyConnect}
            copiedLabel={t.matchCopiedConnect}
            className="w-full max-w-md justify-end sm:w-auto"
          />
        </div>
      </div>

      <div className="shrink-0 space-y-2">
        <LiveScoreStrip
          matchId={match.id}
          team1Name={match.team1Name}
          team2Name={match.team2Name}
          team1Score={match.team1Score}
          team2Score={match.team2Score}
          state={match.state}
          map={match.map}
          maxRounds={match.maxRounds}
          team1Side={match.team1Side}
        />
        <MatchTabs
          matchId={match.id}
          labels={{
            scoreboard: t.matchTabScoreboard,
            console: t.matchTabConsole,
            chat: t.matchTabChat,
            backup: t.matchTabBackup,
            control: t.matchTabControl,
            server: t.matchTabServer,
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-ink-700/80 bg-ink-950/80 p-3">
        {children}
      </div>
    </div>
  );
}
