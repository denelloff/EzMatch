import React from 'react';
import { Badge } from '../core/Badge.jsx';

const CATEGORY_TONE = { match: 'ok', combat: 'danger', connection: 'info', server: 'warn', chat: 'neutral', economy: 'neutral', other: 'neutral' };

export function EventFeed({ events = [], maxHeight = 448 }) {
  const [filter, setFilter] = React.useState('all');
  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];
  const visible = filter === 'all' ? events : events.filter((e) => e.category === filter);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', borderBottom: 'var(--border-w) solid var(--border-1)', padding: 'var(--space-6) var(--pad-card-x)' }}>
        {categories.map((c) => {
          const on = c === filter;
          return (
            <button key={c} type="button" onClick={() => setFilter(c)} style={{
              cursor: 'pointer', borderRadius: 'var(--radius-pill)',
              border: 'var(--border-w) solid ' + (on ? 'var(--brand-500)' : 'var(--border-1)'),
              background: on ? 'var(--brand-wash)' : 'transparent',
              color: on ? 'var(--brand-500)' : 'var(--text-faint)',
              padding: '2px var(--space-5)', fontSize: 'var(--text-xs)', transition: 'var(--transition-color)',
            }}>{c}</button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p style={{ margin: 0, padding: 'var(--space-20) var(--pad-card-x)', textAlign: 'center', font: 'var(--type-body)', color: 'var(--text-faint)' }}>
          Nothing yet. Events appear once the server logs a round or a player connects.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight, overflow: 'auto' }}>
          {visible.map((e, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)', borderTop: i ? 'var(--border-w) solid var(--ink-800)' : 0, padding: 'var(--space-4) var(--pad-card-x)', fontSize: 'var(--text-base)' }}>
              <span className="console-surface" style={{ width: 64, flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>{e.time}</span>
              <Badge tone={CATEGORY_TONE[e.category] || 'neutral'}>{e.kind}</Badge>
              <span className="console-surface" style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{e.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
