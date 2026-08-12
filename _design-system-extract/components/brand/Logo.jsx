import React from 'react';

const MARKS = {
  shard: '../../assets/logo-shard.svg',
  bracket: '../../assets/logo-bracket.svg',
  reticle: '../../assets/logo-reticle.svg',
  caret: '../../assets/logo-caret.svg',
};

const SIZES = { sm: [22, 'var(--text-sm)'], md: [28, 'var(--text-md)'], lg: [40, 'var(--text-2xl)'] };

export function Logo({ mark = 'reticle', size = 'md', subtitle, href = '/', src, style }) {
  const [px, font] = SIZES[size] || SIZES.md;
  return (
    <a href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-5)', textDecoration: 'none', ...style }}>
      <img src={src || MARKS[mark] || MARKS.shard} alt="" width={px} height={px} style={{ display: 'block', borderRadius: 'var(--radius-md)' }} />
      <span style={{ minWidth: 0, lineHeight: 1.15 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: font, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>eZ-Match</span>
        {subtitle ? <span style={{ display: 'block', marginTop: 2, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)', color: 'var(--text-faint)' }}>{subtitle}</span> : null}
      </span>
    </a>
  );
}
