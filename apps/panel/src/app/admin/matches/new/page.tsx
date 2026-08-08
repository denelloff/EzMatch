import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { listEnabledMaps } from '@/lib/maps';
import { MatchCreateForm } from './match-create-form';

export const dynamic = 'force-dynamic';

export default async function AdminCreateMatchPage() {
  await requireRole('OPERATOR');
  const t = await getT();

  const [teams, running, maps] = await Promise.all([
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
    prisma.gameInstance.findMany({
      where: { state: 'RUNNING' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        startMap: true,
        gamePort: true,
        server: { select: { name: true } },
        matches: {
          where: { state: { notIn: ['FINISHED', 'CANCELLED'] } },
          select: { id: true },
          take: 1,
        },
      },
    }),
    listEnabledMaps(),
  ]);

  const freeServers = running
    .filter((instance) => instance.matches.length === 0)
    .map((instance) => ({
      id: instance.id,
      label: `${instance.server.name} · ${instance.name} :${instance.gamePort}`,
      map: instance.startMap,
    }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/matches"
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          ← {t.adminNavMatchesLive}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">
          {t.adminNavCreateMatch}
        </h1>
        <p className="mt-1 text-sm text-ink-400">{t.matchCreateDescription}</p>
      </div>

      <MatchCreateForm
        teams={teams}
        servers={freeServers}
        maps={maps}
        cancelHref="/admin/matches"
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
          needServer: t.matchNeedServer,
        }}
      />
    </div>
  );
}
