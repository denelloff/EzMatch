import React from 'react';
import { Logo } from '../brand/Logo.jsx';

export function Sidebar({ sections = [], activeHref, onNavigate, footerLabel = 'Credits', copyright = '© 2026 eZ-Match', mark = 'shard' }) {
  return (
    <aside style={{
      position: 'relative', display: 'flex', flexDirection: 'column',
      width: 'var(--sidebar-w)', flexShrink: 0,
      borderRight: 'var(--border-w) solid var(--border-1)',
      background: 'var(--surface-1)', backdropFilter: 'blur(var(--blur-chrome))',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .5, background: 'radial-gradient(ellipse 80% 40% at 0% 0%, var(--brand-glow), transparent 55%)' }} />
      <div style={{ position: 'relative', borderBottom: 'var(--border-w) solid var(--border-1)', padding: 'var(--space-7) var(--space-8)' }}>
        <Logo size="sm" subtitle="Admin" mark={mark} />
      </div>
      <nav style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: 'var(--space-7) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
        {sections.map((section) => (
          <div key={section.title}>
            <p style={{ margin: '0 0 var(--space-4)', padding: '0 var(--space-5)', font: 'var(--type-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)', color: 'var(--text-faint)' }}>{section.title}</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => (
                <SidebarItem key={item.href} item={item} active={item.href === activeHref} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div style={{ position: 'relative', borderTop: 'var(--border-w) solid var(--border-1)', padding: 'var(--space-7) var(--space-6)', textAlign: 'center' }}>
        <span style={{ font: 'var(--type-small)', color: 'var(--text-faint)' }}>{footerLabel}</span>
        <p style={{ margin: 'var(--space-4) 0 0', font: 'var(--type-small)', fontSize: 'var(--text-3xs)', color: 'var(--text-faint)', opacity: .8 }}>{copyright}</p>
      </div>
    </aside>
  );
}

function SidebarItem({ item, active, onNavigate }) {
  const [hover, setHover] = React.useState(false);
  return (
    <li>
      <a
        href={item.href}
        onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate(item.href); } }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-4) var(--space-5)',
          fontSize: 'var(--text-base)', textDecoration: 'none',
          borderLeft: '2px solid ' + (active ? 'var(--brand-500)' : 'transparent'),
          background: active ? 'var(--surface-3)' : hover ? 'var(--surface-2)' : 'transparent',
          color: active ? 'var(--text-strong)' : hover ? 'var(--text-strong)' : 'var(--text-muted)',
          fontWeight: active ? 'var(--weight-medium)' : 'var(--weight-regular)',
          transition: 'var(--transition-color)',
        }}
      >
        <span>{item.label}</span>
        {typeof item.count === 'number' ? (
          <span className="tabular" style={{ borderRadius: 'var(--radius-pill)', background: active ? 'var(--ink-700)' : 'var(--surface-3)', padding: '0 6px', fontSize: 'var(--text-3xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-body)' }}>{item.count}</span>
        ) : null}
      </a>
    </li>
  );
}
