import React from 'react';

const BASE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)',
  height: 'var(--control-h)', padding: '0 var(--space-8)', borderRadius: 'var(--radius-md)',
  font: 'var(--type-body)', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-base)',
  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'var(--transition-color)',
  border: 'var(--border-w) solid transparent', textDecoration: 'none',
};

const VARIANTS = {
  primary: { background: 'var(--accent)', color: 'var(--text-on-brand)', fontWeight: 'var(--weight-semibold)', borderRadius: 'var(--radius-sm)', clipPath: 'var(--clip-notch)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-display)' },
  secondary: { background: 'var(--surface-2)', color: 'var(--text-body)', borderColor: 'var(--border-2)' },
  ghost: { background: 'transparent', color: 'var(--text-faint)' },
  danger: { background: 'transparent', color: 'var(--danger-500)', borderColor: 'rgba(255,90,95,.5)' },
};

const HOVER = {
  primary: { background: 'var(--accent-hover)' },
  secondary: { background: 'var(--surface-3)', borderColor: 'var(--border-strong)', color: 'var(--text-strong)' },
  ghost: { background: 'var(--surface-3)', color: 'var(--text-strong)' },
  danger: { background: 'rgba(255,90,95,.10)', borderColor: 'var(--danger-500)' },
};

const SIZES = {
  sm: { height: 'var(--control-h-sm)', padding: '0 var(--space-6)', fontSize: 'var(--text-xs)', clipPath: 'var(--clip-notch-sm)' },
  md: {},
  lg: { height: '44px', padding: '0 var(--space-12)', fontSize: 'var(--text-md)' },
};

export function Button({ variant = 'primary', size = 'md', block = false, disabled = false, type = 'button', href, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const Tag = href ? 'a' : 'button';
  const s = {
    ...BASE, ...VARIANTS[variant], ...SIZES[size],
    ...(hover && !disabled ? HOVER[variant] : null),
    ...(block ? { display: 'flex', width: '100%' } : null),
    ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : null),
    ...style,
  };
  return (
    <Tag
      {...rest}
      href={href}
      type={href ? undefined : type}
      disabled={href ? undefined : disabled}
      style={s}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Tag>
  );
}
