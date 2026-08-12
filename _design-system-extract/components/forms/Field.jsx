import React from 'react';

export function Field({ label, hint, error, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: 'var(--space-3)', font: 'var(--type-body)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{label}</span>
      {children}
      {hint && !error ? <span style={{ display: 'block', marginTop: 'var(--space-3)', font: 'var(--type-small)', color: 'var(--text-faint)' }}>{hint}</span> : null}
      {error ? <span style={{ display: 'block', marginTop: 'var(--space-3)', font: 'var(--type-small)', color: 'var(--danger-500)' }}>{error}</span> : null}
    </label>
  );
}
