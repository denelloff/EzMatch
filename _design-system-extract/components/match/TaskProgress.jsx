import React from 'react';

export function TaskProgress({ label, percent = 0, state = 'running', eta }) {
  const color = state === 'failed' ? 'var(--danger-500)' : state === 'done' ? 'var(--ok-500)' : 'var(--brand-500)';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
        <span style={{ font: 'var(--type-body)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{label}</span>
        <span className="tabular" style={{ font: 'var(--type-mono)', color: 'var(--text-faint)' }}>
          {Math.round(percent)}%{eta ? ' · ' + eta : ''}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ width: Math.max(0, Math.min(100, percent)) + '%', height: '100%', background: color, transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>
    </div>
  );
}
