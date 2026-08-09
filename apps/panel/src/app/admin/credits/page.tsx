import { Card } from '@/components/ui';
import { getT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default async function AdminCreditsPage() {
  const t = await getT();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4">
      <Card className="w-full overflow-hidden">
        <div
          className="relative border-b border-ink-700/80 px-8 pb-8 pt-10 text-center"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(110,168,216,0.16), transparent 70%)',
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
            {t.adminNavCredits}
          </p>
          <h1
            className="mt-3 text-3xl font-semibold tracking-tight text-ink-100"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t.brand}
          </h1>
          <p className="mt-2 text-sm text-ink-400">{t.brandTagline}</p>
        </div>

        <div className="flex flex-col items-center gap-5 px-8 py-8 text-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
              {t.creditsAuthor}
            </p>
            <p
              className="mt-2 text-lg font-semibold tracking-tight text-ink-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Denis{' '}
              <span className="text-brand-500">&ldquo;denello&rdquo;</span>{' '}
              Marker
            </p>
          </div>

          <a
            href="https://t.me/denelloff"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram @denelloff"
            className="inline-flex items-center gap-2.5 rounded-xl border border-ink-600/80 bg-ink-850/80 px-4 py-2.5 text-sm font-medium text-ink-200 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition duration-200 hover:border-brand-500/50 hover:bg-ink-800 hover:text-brand-500"
          >
            <TelegramIcon className="size-5 text-[#2AABEE]" />
            <span>@denelloff</span>
          </a>
        </div>
      </Card>
    </div>
  );
}

