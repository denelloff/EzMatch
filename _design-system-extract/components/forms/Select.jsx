import React from 'react';

const CHEVRON = "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2.2 3.8 5 6.6 7.8 3.8' fill='none' stroke='%237b8493' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export function Select({ options = [], placeholder, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <select
      {...rest}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        ...{
  width: '100%', boxSizing: 'border-box', height: 'var(--control-h)',
  borderRadius: 'var(--radius-md)', border: 'var(--border-w) solid var(--border-1)',
  background: 'var(--surface-2)', padding: '0 var(--space-6)',
  font: 'var(--type-body)', fontSize: 'var(--text-base)', color: 'var(--text-strong)',
  outline: 'none', transition: 'var(--transition-color)',
},
        appearance: 'none', paddingRight: '36px',
        backgroundImage: CHEVRON, backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center', backgroundSize: '10px',
        borderColor: focus ? 'var(--brand-500)' : 'var(--border-1)',
        boxShadow: focus ? 'var(--ring-focus)' : 'none', cursor: 'pointer', ...style,
      }}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
