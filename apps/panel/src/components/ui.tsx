import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-ink-700/80 bg-ink-900/85 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_12px_40px_-28px_rgba(0,0,0,0.7)] backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-700/80 px-5 py-4">
      <div>
        <h2
          className="text-sm font-semibold tracking-tight text-ink-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs text-ink-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

type Tone = 'ok' | 'warn' | 'danger' | 'neutral' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  ok: 'border-ok-500/35 bg-ok-500/10 text-ok-500',
  warn: 'border-warn-500/35 bg-warn-500/10 text-warn-500',
  danger: 'border-danger-500/35 bg-danger-500/10 text-danger-500',
  info: 'border-brand-500/35 bg-brand-500/10 text-brand-500',
  neutral: 'border-ink-600/80 bg-ink-800/80 text-ink-300',
};

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p
        className="text-sm font-semibold text-ink-200"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </p>
      <p className="max-w-md text-sm text-ink-400">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm text-ink-300">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-400">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-ink-700/90 bg-ink-850/90 px-3.5 py-2.5 text-sm text-ink-100 outline-none transition duration-200 placeholder:text-ink-400 focus:border-brand-500/80 focus:bg-ink-850 focus:shadow-[0_0_0_3px_rgba(110,168,216,0.16)] disabled:opacity-60';

export const selectClass = clsx(inputClass, 'ppanel-select');

export const checkboxClass = 'ppanel-checkbox';

export const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_20px_-10px_rgba(110,168,216,0.7)] transition duration-200 hover:brightness-110 hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_12px_28px_-10px_rgba(110,168,216,0.85)] active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none';

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-ink-600/90 bg-ink-850/80 px-4 py-2 text-sm font-semibold text-ink-200 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition duration-200 hover:border-ink-400 hover:bg-ink-800 hover:text-ink-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60';

export const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-2 text-sm font-semibold text-danger-500 transition duration-200 hover:border-danger-500/60 hover:bg-danger-500/18 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60';

/** Compact inline entry point — instance links, backup files, filter chips. */
export const chipClass =
  'rounded-xl border border-ink-600/80 bg-ink-850/70 px-2.5 py-1 text-xs text-ink-200 transition duration-200 hover:border-brand-500/50 hover:text-brand-500';

const NOTICE_CLASS: Record<'warn' | 'danger' | 'info', string> = {
  warn: 'border-warn-500/35 bg-warn-500/10 text-warn-500',
  danger: 'border-danger-500/35 bg-danger-500/10 text-danger-500',
  info: 'border-brand-500/35 bg-brand-500/10 text-brand-500',
};

export function Notice({
  tone = 'danger',
  children,
  className,
  role = tone === 'danger' ? 'alert' : undefined,
}: {
  tone?: 'warn' | 'danger' | 'info';
  children: ReactNode;
  className?: string;
  role?: string;
}) {
  return (
    <p
      role={role}
      className={clsx(
        'rounded-xl border px-4 py-3 text-sm',
        NOTICE_CLASS[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}

