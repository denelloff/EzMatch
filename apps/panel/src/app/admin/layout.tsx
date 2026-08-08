import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { LIVE_MATCH_STATES } from '@/lib/match-state';
import { getLocale, getT } from '@/lib/i18n';
import { AdminSidebar, type AdminNavSection } from '@/components/admin-sidebar';
import { LanguageToggle } from '@/components/language-toggle';
import { logoutAction } from '../login/actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('ADMIN');
  const t = await getT();
  const locale = await getLocale();

  const [liveMatches, draftMatches] = await Promise.all([
    prisma.match.count({ where: { state: { in: [...LIVE_MATCH_STATES] } } }),
    prisma.match.count({ where: { state: 'DRAFT' } }),
  ]);

  const sections: AdminNavSection[] = [
    {
      title: t.adminSectionMain,
      items: [
        { href: '/admin', label: t.adminNavHome },
        { href: '/admin/stats', label: t.adminNavStatistics },
      ],
    },
    {
      title: t.adminSectionMatch,
      items: [
        {
          href: '/admin/matches',
          label: t.adminNavMatchesLive,
          count: liveMatches,
        },
        { href: '/admin/matches/archive', label: t.adminNavMatchesArchive },
        { href: '/admin/seasons', label: t.adminNavSeasons },
      ],
    },
    {
      title: t.adminSectionMatchMgmt,
      items: [
        { href: '/admin/matches/new', label: t.adminNavCreateMatch },
        {
          href: '/admin/matches/mine',
          label: t.adminNavMyMatches,
          count: draftMatches,
        },
      ],
    },
    {
      title: t.adminSectionTeams,
      items: [
        { href: '/admin/teams/new', label: t.adminNavCreateTeam },
        { href: '/admin/teams', label: t.adminNavTeams },
      ],
    },
    {
      title: t.adminSectionServers,
      items: [
        { href: '/admin/servers/new', label: t.adminNavAddServer },
        { href: '/admin/servers', label: t.adminNavServers },
      ],
    },
    {
      title: t.adminSectionStats,
      items: [
        { href: '/admin/stats', label: t.navStatsGlobal },
        { href: '/admin/stats/maps', label: t.navStatsMaps },
        { href: '/admin/stats/weapons', label: t.navStatsWeapons },
      ],
    },
    {
      title: t.adminSectionSettings,
      items: [{ href: '/admin/settings', label: t.adminNavSettings }],
    },
  ];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        sections={sections}
        creditsLabel={t.adminNavCredits}
        copyright={`© ${new Date().getFullYear()} eZ-Match`}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-ink-700/80 bg-ink-900/70 px-6 backdrop-blur-md">
          <p
            className="text-sm font-medium tracking-tight text-ink-300"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t.adminTitle}
          </p>
          <div className="flex items-center gap-3">
            <LanguageToggle
              locale={locale}
              labels={{ en: t.langEn, ru: t.langRu }}
            />
            <span className="text-xs text-ink-400">
              {user.displayName}
              <span className="ml-2 rounded-lg border border-ink-600/80 bg-ink-850/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-300">
                {user.role}
              </span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl px-2.5 py-1.5 text-xs text-ink-400 transition duration-200 hover:bg-ink-800 hover:text-ink-100"
              >
                {t.signOut}
              </button>
            </form>
          </div>
        </header>

        <main className="ezmatch-enter flex-1 overflow-auto px-6 py-4">{children}</main>
      </div>
    </div>
  );
}
