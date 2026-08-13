import React from 'react';

export function Chip({ as = 'span', active = false, href, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const Tag = href ? 'a' : as;
  const on = active || hover;
  return (
    <Tag
      {...rest}
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)',
        borderRadius: 'var(--radius-md)', border: 'var(--border-w) solid ' + (on ? 'var(--brand-500)' : 'var(--border-2)'),
        background: 'var(--surface-2)', padding: '5px var(--space-5)',
        fontSize: 'var(--text-xs)', color: on ? 'var(--brand-500)' : 'var(--text-body)',
        textDecoration: 'none', cursor: href || as === 'button' ? 'pointer' : 'default',
        transition: 'var(--transition-color)', ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Tag>
  );
}
