import React from 'react';

export function EmptyState({ title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 'var(--space-4)', padding: 'var(--space-32) var(--space-12)', textAlign: 'center',
    }}>
      <p style={{ margin: 0, font: 'var(--type-h2)', color: 'var(--text-body)' }}>{title}</p>
      <p style={{ margin: 0, maxWidth: 420, font: 'var(--type-body)', color: 'var(--text-faint)' }}>{description}</p>
      {action ? <div style={{ marginTop: 'var(--space-6)' }}>{action}</div> : null}
    </div>
  );
}
