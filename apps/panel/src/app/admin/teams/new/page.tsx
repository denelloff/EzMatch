import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getT } from '@/lib/i18n';
import { TeamForm } from '../team-form';

export const dynamic = 'force-dynamic';

export default async function AdminCreateTeamPage() {
  await requireRole('ADMIN');
  const t = await getT();

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
          {t.adminNavCreateTeam}
        </h1>
        <p className="mt-1 text-sm text-ink-400">{t.teamsCreateDescription}</p>
      </div>

      <TeamForm
        mode="create"
        cancelHref="/admin/teams"
        labels={{
          name: t.teamsFieldName,
          nameHint: t.teamsCreateDescription,
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
