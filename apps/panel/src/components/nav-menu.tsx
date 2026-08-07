'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export interface NavItem {
  href: string;
  label: string;
  /** Rendered as a small count next to the label, e.g. matches in progress. */
  count?: number;
}

const TRIGGER_CLASS =
  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition duration-200';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        TRIGGER_CLASS,
        active
          ? 'bg-ink-850 text-ink-100 shadow-[inset_0_-2px_0_0_var(--color-brand-500)]'
          : 'text-ink-300 hover:bg-ink-850/70 hover:text-ink-100',
      )}
    >
      {item.label}
      {item.count ? (
        <span className="rounded-full bg-ink-700 px-1.5 text-[10px] font-semibold tabular-nums text-ink-200">
          {item.count}
        </span>
      ) : null}
    </Link>
  );
}

export function NavMenu({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const active = items.some((item) => isActive(pathname, item.href));

  // Route changes come from clicking an item inside the menu, so the panel has
  // to close itself — nothing unmounts it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          TRIGGER_CLASS,
          active || open
            ? 'bg-ink-850 text-ink-100'
            : 'text-ink-300 hover:bg-ink-850/70 hover:text-ink-100',
        )}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path
            d="M2.2 3.8 5 6.6 7.8 3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1.5 min-w-48 rounded-xl border border-ink-700/80 bg-ink-900/95 py-1 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={clsx(
                'mx-1 block rounded-lg px-3 py-1.5 text-sm transition duration-150',
                isActive(pathname, item.href)
                  ? 'bg-ink-850 text-ink-100'
                  : 'text-ink-300 hover:bg-ink-850/70 hover:text-ink-100',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
