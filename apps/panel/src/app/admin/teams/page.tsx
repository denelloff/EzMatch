import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { countryName, flagUrl } from '@/lib/countries';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  buttonClass,
  dangerButtonClass,
  secondaryButtonClass,
} from '@/components/ui';
import { deleteTeamAction } from './actions';
import { ImportProTeamsButton } from './import-preset-button';

export const dynamic = 'force-dynamic';

export default async function AdminTeamsPage() {
  await requireRole('ADMIN');
  const t = await getT();

  const teams = await prisma.team.findMany({
    orderBy: [{ name: 'asc' }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-100">{t.adminNavTeams}</h1>
          <p className="mt-1 text-sm text-ink-400">{t.teamsManageDescription}</p>
        </div>
        <Link href="/admin/teams/new" className={buttonClass}>
          {t.adminNavCreateTeam}
        </Link>
      </div>

      <Card>
        <CardHeader
          title={t.teamsPresetTitle}
          description={t.teamsPresetDescription}
        />
        <div className="px-5 py-4">
          <ImportProTeamsButton
            label={t.teamsPresetImport}
            hint={t.teamsPresetHint}
            resultLabel={t.teamsPresetResult}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title={t.teamsListTitle}
          description={
            teams.length === 0
              ? t.teamsListEmpty
              : t.teamsListCount.replace('{count}', String(teams.length))
          }
        />
        {teams.length === 0 ? (
          <EmptyState
            title={t.teamsListEmpty}
            description={t.teamsManageDescription}
            action={
              <Link href="/admin/teams/new" className={secondaryButtonClass}>
                {t.adminNavCreateTeam}
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-ink-700/80">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-700 bg-ink-850">
                    {team.logoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={team.logoPath}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-ink-400">
                        {team.tag.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-100">
                      {team.name}{' '}
                      <span className="text-ink-400">({team.tag})</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={flagUrl(team.country)}
                        alt=""
                        width={18}
                        height={12}
                        className="h-3 w-[18px] rounded-sm object-cover"
                      />
                      <span className="console-surface">{team.country}</span>
                      <span>{countryName(team.country)}</span>
                      {team.presetKey ? (
                        <Badge tone="info">{t.teamsPresetBadge}</Badge>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/teams/${team.id}/edit`}
                    className={secondaryButtonClass}
                  >
                    {t.teamsEdit}
                  </Link>
                  <form action={deleteTeamAction}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <button type="submit" className={dangerButtonClass}>
                      {t.teamsDelete}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
