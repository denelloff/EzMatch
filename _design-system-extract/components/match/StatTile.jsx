import React from 'react';

export function StatTile({ label, value, hint, tone = 'neutral' }) {
  const color = tone === 'brand' ? 'var(--brand-500)' : tone === 'ok' ? 'var(--ok-500)' : 'var(--text-strong)';
  return (
    <div style={{ padding: 'var(--pad-card-y) var(--pad-card-x)', minWidth: 0 }}>
      <dt style={{ font: 'var(--type-small)', color: 'var(--text-faint)' }}>{label}</dt>
      <dd className="tabular" style={{ margin: '2px 0 0', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xl)', color }}>{value}</dd>
      {hint ? <p style={{ margin: '2px 0 0', font: 'var(--type-small)', fontSize: 'var(--text-3xs)', color: 'var(--text-faint)' }}>{hint}</p> : null}
    </div>
  );
}
