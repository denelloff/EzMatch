import React from 'react';

export function LanguageToggle({ locale = 'en', onChange, labels = { en: 'EN', ru: 'RU' } }) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 'var(--radius-md)', border: 'var(--border-w) solid var(--border-2)', background: 'var(--surface-2)', padding: '2px', gap: '2px' }}>
      {['en', 'ru'].map((code) => {
        const on = code === locale;
        return (
          <button key={code} type="button" onClick={() => onChange && onChange(code)} style={{
            border: 0, cursor: 'pointer', borderRadius: 'var(--radius-sm)',
            padding: '3px var(--space-5)', fontSize: 'var(--text-3xs)', fontWeight: 'var(--weight-semibold)',
            textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)',
            background: on ? 'var(--brand-500)' : 'transparent',
            color: on ? 'var(--text-on-brand)' : 'var(--text-faint)',
            transition: 'var(--transition-color)',
          }}>{labels[code]}</button>
        );
      })}
    </div>
  );
}
