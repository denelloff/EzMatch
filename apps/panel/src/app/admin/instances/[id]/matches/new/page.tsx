import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assertRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { listEnabledMaps } from '@/lib/maps';
import { MatchCreateForm } from '@/app/admin/matches/new/match-create-form';

export const dynamic = 'force-dynamic';

export default async function NewMatchOnInstancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertRole('OPERATOR');
  const t = await getT();
  const { id } = await params;

  const [instance, teams, maps] = await Promise.all([
    prisma.gameInstance.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        startMap: true,
        state: true,
        gamePort: true,
        server: { select: { name: true } },
        matches: {
          where: { state: { notIn: ['FINISHED', 'CANCELLED'] } },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.team.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        tag: true,
        country: true,
        logoPath: true,
      },
    }),
    listEnabledMaps(),
  ]);
  if (!instance) notFound();

  const servers =
    instance.state === 'RUNNING' && instance.matches.length === 0
      ? [
          {
            id: instance.id,
            label: `${instance.server.name} · ${instance.name} :${instance.gamePort}`,
            map: instance.startMap,
          },
        ]
      : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/admin/instances/${instance.id}`}
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          ← {instance.name}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">
          {t.adminNavCreateMatch}
        </h1>
        <p className="mt-1 text-sm text-ink-400">{t.matchCreateDescription}</p>
      </div>

      <MatchCreateForm
        teams={teams}
        servers={servers}
        maps={maps}
        defaultInstanceId={servers[0]?.id}
        defaultMap={instance.startMap}
        cancelHref={`/admin/instances/${instance.id}`}
        labels={{
          teamCt: t.matchTeamCt,
          teamT: t.matchTeamT,
          pickTeam: t.matchPickTeam,
          config: t.matchConfig,
          server: t.matchServer,
          serverHint: t.matchServerHint,
          pickServer: t.matchPickServer,
          map: t.matchMap,
          mr: t.matchMr,
          mrHint: t.matchMrHint,
          knife: t.matchKnife,
          knifeHint: t.matchKnifeHint,
          overtime: t.matchOvertime,
          overtimeMr: t.matchOvertimeMr,
          overtimeMrHint: t.matchOvertimeMrHint,
          overtimeStartMoney: t.matchOvertimeStartMoney,
          overtimeStartMoneyHint: t.matchOvertimeStartMoneyHint,
          overtimeStartMoneyCustom: t.matchOvertimeStartMoneyCustom,
          overtimeStartMoneySave: t.matchOvertimeStartMoneySave,
          overtimeStartMoneySaved: t.matchOvertimeStartMoneySaved,
          title: t.matchTitle,
          titleHint: t.matchTitleHint,
          password: t.matchPassword,
          passwordHint: t.matchPasswordHint,
          submit: t.matchSubmit,
          cancel: t.teamsCancel,
          needTeams: t.matchNeedTeams,
          needServer:
            instance.state !== 'RUNNING'
              ? t.matchNeedServerRunning
              : instance.matches.length > 0
                ? t.matchNeedServerBusy
                : t.matchNeedServer,
        }}
      />
    </div>
  );
}
