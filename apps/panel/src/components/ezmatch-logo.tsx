'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useId } from 'react';

export function EzMatchLogo({
  href = '/',
  subtitle,
  size = 'md',
  className,
}: {
  href?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const gradId = useId();
  const mark = size === 'lg' ? 36 : size === 'sm' ? 22 : 28;
  const title =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <Link
      href={href}
      className={clsx(
        'group inline-flex items-center gap-2.5 no-underline',
        className,
      )}
    >
      <span
        className="relative shrink-0 overflow-hidden rounded-[0.65rem] shadow-[0_0_0_1px_rgba(110,168,216,0.25)] transition duration-300 group-hover:shadow-[0_0_0_1px_rgba(110,168,216,0.45),0_8px_24px_-12px_rgba(110,168,216,0.55)]"
        style={{ width: mark, height: mark }}
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="size-full" role="img">
          <defs>
            <linearGradient id={gradId} x1="8" y1="4" x2="34" y2="36">
              <stop stopColor="#8ec0e8" />
              <stop offset="1" stopColor="#4f87b8" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill="#1a1f26" />
          <path
            d="M10 12.2 H26.5 C29.4 12.2 31.2 14.1 31.2 16.8 C31.2 19.1 29.9 20.7 27.8 21.2 C30.2 21.6 31.8 23.4 31.8 26 C31.8 29 29.8 31 26.6 31 H10 Z M15.2 16.4 V19.6 H24.6 C25.7 19.6 26.4 18.9 26.4 18 C26.4 17.1 25.7 16.4 24.6 16.4 Z M15.2 23.4 V26.8 H25 C26.2 26.8 27 26 27 25.1 C27 24.2 26.2 23.4 25 23.4 Z"
            fill={`url(#${gradId})`}
          />
        </svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={clsx(
            'block font-semibold tracking-tight text-ink-100 transition group-hover:text-white',
            title,
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          eZ-Match
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

