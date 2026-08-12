import React from 'react';

export function Input({ invalid = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <input
      {...rest}
      onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
      onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
      style={{
        ...{
  width: '100%', boxSizing: 'border-box', height: 'var(--control-h)',
  borderRadius: 'var(--radius-md)', border: 'var(--border-w) solid var(--border-1)',
  background: 'var(--surface-2)', padding: '0 var(--space-6)',
  font: 'var(--type-body)', fontSize: 'var(--text-base)', color: 'var(--text-strong)',
  outline: 'none', transition: 'var(--transition-color)',
},
        borderColor: invalid ? 'var(--danger-500)' : focus ? 'var(--brand-500)' : 'var(--border-1)',
        boxShadow: focus ? 'var(--ring-focus)' : 'none',
        ...(rest.disabled ? { opacity: .6, cursor: 'not-allowed' } : null),
        ...style,
      }}
    />
  );
}
