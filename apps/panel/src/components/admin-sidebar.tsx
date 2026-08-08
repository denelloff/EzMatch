'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EzMatchLogo } from '@/components/pmatch-logo';

export interface AdminNavItem {
  href: string;
  label: string;
  count?: number;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';

  // More specific routes win: /admin/matches/archive must not light up
  // /admin/matches, and /admin/stats/maps must not light up /admin/stats.
  if (href === '/admin/matches') {
    return (
      pathname === '/admin/matches' ||
      (pathname.startsWith('/admin/matches/') &&
        !pathname.startsWith('/admin/matches/archive') &&
        !pathname.startsWith('/admin/matches/new') &&
        !pathname.startsWith('/admin/matches/mine'))
    );
  }

  // Keep "Add gameserver" and "Server management" mutually exclusive.
  if (href === '/admin/servers') {
    return (
      pathname === '/admin/servers' ||
      (pathname.startsWith('/admin/servers/') &&
        !pathname.startsWith('/admin/servers/new'))
    );
  }
  if (href === '/admin/servers/new') {
    return pathname === '/admin/servers/new';
  }

  if (href === '/admin/stats') {
    return pathname === '/admin/stats';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  sections,
  creditsLabel,
  copyright,
}: {
  sections: AdminNavSection[];
  creditsLabel: string;
  copyright: string;
}) {
  const pathname = usePathname();
  const creditsActive = pathname === '/admin/credits';

  return (
    <aside className="relative flex w-60 shrink-0 flex-col border-r border-ink-700/80 bg-ink-900/90 backdrop-blur-md">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 0% 0%, rgba(110,168,216,0.12), transparent 55%)',
        }}
      />
      <div className="relative border-b border-ink-700/80 px-4 py-4">
        <EzMatchLogo href="/admin" subtitle="Admin" size="sm" />
      </div>

      <nav className="relative flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={`${section.title}:${item.href}`}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'flex items-center justify-between rounded-xl border border-ink-600/70 bg-ink-850/90 px-2.5 py-2 text-sm font-medium text-ink-100 shadow-[inset_3px_0_0_0_var(--color-brand-500)] transition duration-200'
                          : 'flex items-center justify-between rounded-xl border border-transparent px-2.5 py-2 text-sm text-ink-300 transition duration-200 hover:border-ink-700 hover:bg-ink-850/60 hover:text-ink-100'
                      }
                    >
                      <span>{item.label}</span>
                      {typeof item.count === 'number' ? (
                        <span
                          className={
                            active
                              ? 'rounded-full bg-ink-700 px-1.5 text-[10px] font-semibold tabular-nums text-ink-200'
                              : 'rounded-full bg-ink-800 px-1.5 text-[10px] font-semibold tabular-nums text-ink-300'
                          }
                        >
                          {item.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative mt-auto border-t border-ink-700/80 px-3 py-4 text-center">
        <Link
          href="/admin/credits"
          aria-current={creditsActive ? 'page' : undefined}
          className={
            creditsActive
              ? 'inline-block text-xs font-medium text-brand-500 transition duration-200'
              : 'inline-block text-xs text-ink-400 transition duration-200 hover:text-ink-200'
          }
        >
          {creditsLabel}
        </Link>
        <p className="mt-2 text-[10px] tracking-wide text-ink-400/80">
          {copyright}
        </p>
      </div>
    </aside>
  );
}
