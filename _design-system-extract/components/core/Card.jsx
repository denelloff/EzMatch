import React from 'react';

export function Card({ inset = false, style, children, ...rest }) {
  return (
    <div {...rest} style={{
      borderRadius: 'var(--radius-xl)', border: 'var(--border-w) solid var(--border-1)',
      background: inset ? 'var(--surface-inset)' : 'var(--surface-card)', overflow: 'hidden', ...style,
    }}>{children}</div>
  );
}

export function CardHeader({ title, description, action, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-8)',
      borderBottom: 'var(--border-w) solid var(--border-1)',
      padding: 'var(--pad-card-y) var(--pad-card-x)', ...style,
    }}>
      <div style={{ minWidth: 0, display: 'flex', gap: 'var(--space-5)' }}>
        <span aria-hidden style={{ marginTop: 3, width: 2, alignSelf: 'stretch', flexShrink: 0, background: 'var(--brand-500)' }} />
        <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, font: 'var(--type-h2)', color: 'var(--text-strong)' }}>{title}</h2>
        {description ? <p style={{ margin: '4px 0 0', font: 'var(--type-small)', color: 'var(--text-faint)' }}>{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ style, children }) {
  return <div style={{ padding: 'var(--pad-card-y) var(--pad-card-x)', ...style }}>{children}</div>;
}
