'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/dictionaries';

/**
 * Language switch posts to /api/locale. A relative return path is required so
 * a reverse proxy cannot bounce the browser onto localhost via an absolute
 * Location built from the Node bind address.
 */
export function LanguageToggle({
  locale,
  labels,
  returnTo,
}: {
  locale: Locale;
  labels: { en: string; ru: string };
  /** Preferred when the server already knows the path (e.g. /login). */
  returnTo?: string;
}) {
  const pathname = usePathname();
  const target =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : pathname || '/';

  const isRu = locale === 'ru';
  const next: Locale = isRu ? 'en' : 'ru';

  return (
    <form action="/api/locale" method="post" className="inline-flex">
      <input type="hidden" name="locale" value={next} />
      <input type="hidden" name="return" value={target} />
      <button
        type="submit"
        role="switch"
        aria-checked={isRu}
        aria-label={`${labels.en} / ${labels.ru}`}
        className={clsx(
          'inline-flex items-center gap-2 rounded-xl border border-ink-600/80 bg-ink-850/80 px-2 py-1 text-[11px] font-medium tracking-wide transition duration-200',
          'hover:border-ink-400',
        )}
      >
        <span className={clsx(!isRu ? 'text-ink-100' : 'text-ink-400')}>
          {labels.en}
        </span>
        <span
          aria-hidden="true"
          className={clsx(
            'relative h-4 w-8 shrink-0 overflow-hidden rounded-full transition-colors duration-200',
            isRu ? 'bg-brand-500' : 'bg-ink-600',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 size-3 rounded-full bg-ink-100 shadow-sm transition-all duration-200',
              isRu ? 'left-auto right-0.5' : 'left-0.5 right-auto',
            )}
          />
        </span>
        <span className={clsx(isRu ? 'text-ink-100' : 'text-ink-400')}>
          {labels.ru}
        </span>
      </button>
    </form>
  );
}

