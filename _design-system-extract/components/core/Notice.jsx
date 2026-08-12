import React from 'react';

const TONES = {
  warn: ['rgba(242,181,60,.35)', 'rgba(242,181,60,.10)', 'var(--warn-500)'],
  danger: ['rgba(255,90,95,.35)', 'rgba(255,90,95,.10)', 'var(--danger-500)'],
  info: ['var(--brand-hair)', 'var(--brand-wash)', 'var(--brand-500)'],
};

export function Notice({ tone = 'danger', style, children }) {
  const [border, bg, fg] = TONES[tone] || TONES.danger;
  return (
    <p role={tone === 'danger' ? 'alert' : undefined} style={{
      margin: 0, borderRadius: 'var(--radius-lg)', border: 'var(--border-w) solid ' + border,
      background: bg, color: fg, padding: 'var(--space-6) var(--space-8)',
      font: 'var(--type-body)', fontSize: 'var(--text-base)', ...style,
    }}>{children}</p>
  );
}
