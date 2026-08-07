'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useId } from 'react';

export function PMatchLogo({
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
            d="M8 28 V12.5 C8 10.5 9.4 9 11.5 9 H18.2 C23.8 9 27.2 12.2 27.2 17.2 C27.2 22.2 23.8 25.4 18.2 25.4 H13.2 V28 Z M13.2 20.6 H17.8 C20.6 20.6 22.1 19.1 22.1 17.2 C22.1 15.3 20.6 13.8 17.8 13.8 H13.2 Z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M29.2 28 L24.4 19.6 L29.2 11.2 H33.6 L28.5 19.6 L33.6 28 Z"
            fill="#6ea8d8"
            opacity="0.92"
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
          PMatch
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
