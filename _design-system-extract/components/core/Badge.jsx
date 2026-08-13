import React from 'react';

const TONES = {
  ok: ['rgba(61,220,151,.35)', 'rgba(61,220,151,.10)', 'var(--ok-500)'],
  warn: ['rgba(242,181,60,.35)', 'rgba(242,181,60,.10)', 'var(--warn-500)'],
  danger: ['rgba(255,90,95,.35)', 'rgba(255,90,95,.10)', 'var(--danger-500)'],
  info: ['rgba(74,168,255,.35)', 'rgba(74,168,255,.10)', 'var(--info-500)'],
  brand: ['var(--brand-hair)', 'var(--brand-wash)', 'var(--brand-500)'],
  neutral: ['var(--border-2)', 'var(--surface-3)', 'var(--text-muted)'],
};

export function Badge({ tone = 'neutral', live = false, style, children }) {
  const [border, bg, fg] = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
      borderRadius: 'var(--radius-sm)', border: 'var(--border-w) solid ' + border,
      background: bg, color: fg, padding: '2px var(--space-4)',
      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', whiteSpace: 'nowrap', ...style,
    }}>
      {live ? <span className="ezmatch-live-dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} /> : null}
      {children}
    </span>
  );
}
