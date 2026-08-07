import { ComingSoon } from '@/components/coming-soon';
import { getT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function AdminTeamsPage() {
  const t = await getT();
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-ink-100">{t.adminNavTeams}</h1>
      <ComingSoon />
    </div>
  );
}
