import Link from 'next/link';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { LIVE_MATCH_STATES } from '@/lib/match-state';
import { getLocale, getT } from '@/lib/i18n';
import { NavLink, NavMenu } from '@/components/nav-menu';
import { LanguageToggle } from '@/components/language-toggle';
import { EzMatchLogo } from '@/components/pmatch-logo';
import { logoutAction } from '../login/actions';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const isAdmin = hasRole(user, 'ADMIN');

  const liveMatches = await prisma.match.count({
    where: { state: { in: [...LIVE_MATCH_STATES] } },
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <EzMatchLogo href="/" size="sm" />
          <nav className="flex items-center gap-1">
            <NavLink
              item={{
                href: '/',
                label: t.navMatches,
                count: liveMatches,
              }}
            />
            <NavLink item={{ href: '/matches', label: t.navArchive }} />
            <NavMenu
              label={t.navStats}
              items={[
                { href: '/stats', label: t.navStatsGlobal },
                { href: '/stats/weapons', label: t.navStatsWeapons },
                { href: '/stats/maps', label: t.navStatsMaps },
              ]}
            />
          </nav>
          <div className="ml-auto flex items-center gap-3">
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
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-xl border border-ink-600/90 bg-ink-850/80 px-2.5 py-1.5 text-xs font-semibold text-ink-200 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition duration-200 hover:border-brand-500/50 hover:text-brand-500"
              >
                {t.adminPanel}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="ezmatch-enter mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
