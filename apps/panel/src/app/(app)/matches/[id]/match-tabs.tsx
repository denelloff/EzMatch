'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { segment: '', label: 'Information / Match configuration' },
  { segment: 'stats', label: 'Match statistics' },
  { segment: 'players', label: 'Player statistics' },
  { segment: 'weapons', label: 'Weapon statistics' },
  { segment: 'duels', label: 'Killer / Killed' },
  { segment: 'heatmap', label: 'Heatmap' },
  { segment: 'demos', label: 'Demos' },
];

export function MatchTabs({ matchId }: { matchId: string }) {
  const pathname = usePathname();
  const base = `/matches/${matchId}`;

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-ink-700">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href;

        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
              active
                ? 'border-brand-500 text-ink-100'
                : 'border-transparent text-ink-400 hover:text-ink-200',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
