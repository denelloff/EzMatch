import React from 'react';
import { Logo } from '../brand/Logo.jsx';

export function TopNav({ items = [], activeHref, onNavigate, user, role, right, mark = 'shard' }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      borderBottom: 'var(--border-w) solid var(--border-1)',
      background: 'color-mix(in srgb, var(--surface-1) 78%, transparent)',
      backdropFilter: 'blur(var(--blur-chrome))',
    }}>
      <div style={{ margin: '0 auto', display: 'flex', height: 'var(--header-h)', maxWidth: 'var(--content-max)', alignItems: 'center', gap: 'var(--space-12)', padding: '0 var(--space-8)' }}>
        <Logo size="sm" mark={mark} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {items.map((item) => <NavLink key={item.href} item={item} active={item.href === activeHref} onNavigate={onNavigate} />)}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          {user ? (
            <span style={{ font: 'var(--type-small)', color: 'var(--text-faint)' }}>
              {user}
              {role ? <span style={{ marginLeft: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'var(--border-w) solid var(--border-2)', background: 'var(--surface-2)', padding: '1px 6px', fontSize: 'var(--text-3xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-muted)' }}>{role}</span> : null}
            </span>
          ) : null}
          {right}
        </div>
      </div>
    </header>
  );
}

export function NavLink({ item, active, onNavigate }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={item.href}
      onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate(item.href); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-6)',
        fontSize: 'var(--text-base)', textDecoration: 'none',
        borderBottom: '2px solid ' + (active ? 'var(--brand-500)' : 'transparent'),
        background: active || hover ? 'var(--surface-2)' : 'transparent',
        color: active || hover ? 'var(--text-strong)' : 'var(--text-muted)',
        transition: 'var(--transition-color)',
      }}
    >
      {item.label}
      {item.count ? <span className="tabular" style={{ borderRadius: 'var(--radius-pill)', background: 'var(--ink-700)', padding: '0 6px', fontSize: 'var(--text-3xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-body)' }}>{item.count}</span> : null}
    </a>
  );
}
