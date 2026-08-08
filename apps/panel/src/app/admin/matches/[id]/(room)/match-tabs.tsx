'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { segment: '', labelKey: 'scoreboard' as const },
  { segment: 'console', labelKey: 'console' as const },
  { segment: 'chat', labelKey: 'chat' as const },
  { segment: 'backup', labelKey: 'backup' as const },
  { segment: 'control', labelKey: 'control' as const },
  { segment: 'server', labelKey: 'server' as const },
] as const;

export function MatchTabs({
  matchId,
  labels,
}: {
  matchId: string;
  labels: {
    scoreboard: string;
    console: string;
    chat: string;
    backup: string;
    control: string;
    server: string;
  };
}) {
  const pathname = usePathname();
  const base = `/admin/matches/${matchId}`;

  return (
    <nav className="flex flex-wrap items-end gap-1 border-b border-ink-700">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active =
          tab.segment === ''
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.segment || 'scoreboard'}
            href={href}
            className={clsx(
              '-mb-px border-b-2 px-2.5 py-1.5 text-sm transition duration-200',
              active
                ? 'border-brand-500 font-medium text-ink-100'
                : 'border-transparent text-ink-400 hover:text-ink-200',
            )}
          >
            {labels[tab.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}
