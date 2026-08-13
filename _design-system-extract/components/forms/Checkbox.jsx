import React from 'react';

const CHECK = "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M1.5 5.2 3.8 7.5 8.5 2.6' fill='none' stroke='%230b0c0e' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export function Checkbox({ label, checked, defaultChecked, disabled, onChange, name }) {
  const [inner, setInner] = React.useState(Boolean(defaultChecked));
  const on = checked === undefined ? inner : checked;
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)',
      font: 'var(--type-body)', fontSize: 'var(--text-base)', color: 'var(--text-muted)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1,
    }}>
      <input
        type="checkbox" name={name} checked={on} disabled={disabled}
        onChange={(e) => { setInner(e.target.checked); onChange && onChange(e); }}
        style={{
          appearance: 'none', flexShrink: 0, width: 16, height: 16, margin: 0,
          borderRadius: 'var(--radius-xs)',
          border: 'var(--border-w) solid ' + (on ? 'var(--brand-500)' : 'var(--border-2)'),
          background: on ? 'var(--brand-500)' : 'var(--surface-2)',
          backgroundImage: on ? CHECK : 'none', backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center', backgroundSize: '10px',
          cursor: 'inherit', transition: 'var(--transition-color)',
        }}
      />
      {label}
    </label>
  );
}
