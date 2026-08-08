'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { segment: '', labelKey: 'scoreboard' as const },
  { segment: 'stats', labelKey: 'stats' as const },
  { segment: 'players', labelKey: 'players' as const },
  { segment: 'weapons', labelKey: 'weapons' as const },
  { segment: 'duels', labelKey: 'duels' as const },
  { segment: 'heatmap', labelKey: 'heatmap' as const },
  { segment: 'demos', labelKey: 'demos' as const },
] as const;

export function MatchPublicTabs({
  matchId,
  labels,
}: {
  matchId: string;
  labels: {
    scoreboard: string;
    stats: string;
    players: string;
    weapons: string;
    duels: string;
    heatmap: string;
    demos: string;
  };
}) {
  const pathname = usePathname();
  const base = `/matches/${matchId}`;

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
              '-mb-px border-b-2 px-3 py-2.5 text-sm transition duration-200',
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
