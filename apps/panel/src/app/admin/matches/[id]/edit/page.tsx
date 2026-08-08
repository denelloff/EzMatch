import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assertRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { listEnabledMaps } from '@/lib/maps';
import { MatchEditForm } from './edit-form';

export const dynamic = 'force-dynamic';

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertRole('OPERATOR');
  const t = await getT();
  const { id } = await params;

  const [match, maps] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: {
        instance: { select: { name: true, server: { select: { name: true } } } },
      },
    }),
    listEnabledMaps(),
  ]);
  if (!match) notFound();
  if (match.state !== 'DRAFT') {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/matches/mine"
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          ← {t.adminNavMyMatches}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">
          {t.myMatchesEdit} #{match.number}
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          {match.instance.server.name} · {match.instance.name}
        </p>
      </div>

      <MatchEditForm
        match={{
          id: match.id,
          title: match.title,
          map: match.map,
          team1Name: match.team1Name,
          team2Name: match.team2Name,
          maxRounds: match.maxRounds,
          overtimeEnabled: match.overtimeEnabled,
          overtimeRounds: match.overtimeRounds,
          overtimeStartMoney: match.overtimeStartMoney,
          knifeRound: match.knifeRound,
          hasJoinPassword: Boolean(match.joinPasswordEnc),
        }}
        maps={maps}
        labels={{
          title: t.matchTitle,
          map: t.matchMap,
          team1: t.matchTeamCt,
          team2: t.matchTeamT,
          mr: t.matchMr,
          knife: t.matchKnife,
          overtime: t.matchOvertime,
          overtimeMr: t.matchOvertimeMr,
          overtimeStartMoney: t.matchOvertimeStartMoney,
          password: t.matchPassword,
          passwordHint: t.matchPasswordHint,
          clearPassword: t.matchClearPassword,
          submit: t.myMatchesSave,
          cancel: t.teamsCancel,
        }}
      />
    </div>
  );
}
