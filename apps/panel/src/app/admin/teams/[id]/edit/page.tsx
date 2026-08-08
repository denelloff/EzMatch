import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { TeamForm } from '../../team-form';

export const dynamic = 'force-dynamic';

export default async function AdminEditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('ADMIN');
  const t = await getT();
  const { id } = await params;

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/teams"
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          ← {t.adminNavTeams}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">
          {t.teamsEditTitle}
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          {team.name} · {team.tag}
        </p>
      </div>

      <TeamForm
        mode="edit"
        teamId={team.id}
        cancelHref="/admin/teams"
        defaults={{
          name: team.name,
          tag: team.tag,
          country: team.country,
          logoPath: team.logoPath,
        }}
        labels={{
          name: t.teamsFieldName,
          nameHint: t.teamsEditTitle,
          tag: t.teamsFieldTag,
          tagHint: t.teamsFieldTagHint,
          country: t.teamsFieldCountry,
          countryHint: t.teamsFieldCountryHint,
          logo: t.teamsFieldLogo,
          logoHint: t.teamsFieldLogoHint,
          clearLogo: t.teamsClearLogo,
          submitCreate: t.teamsSubmitCreate,
          submitEdit: t.teamsSubmitEdit,
          cancel: t.teamsCancel,
        }}
      />
    </div>
  );
}
