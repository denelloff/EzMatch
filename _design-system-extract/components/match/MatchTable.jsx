import React from 'react';
import { Badge } from '../core/Badge.jsx';
import { Chip } from '../core/Chip.jsx';
import { Checkbox } from '../forms/Checkbox.jsx';
import { EmptyState } from '../core/EmptyState.jsx';

export const STATE_LABEL = {
  DRAFT: 'Not started', WARMUP: 'Warmup', KNIFE: 'Knife round', KNIFE_DECISION: 'Side decision',
  LIVE: 'Live', PAUSED: 'Paused', HALFTIME: 'Halftime', OVERTIME: 'Overtime',
  FINISHED: 'Finished', CANCELLED: 'Cancelled',
};
export const STATE_TONE = {
  DRAFT: 'neutral', WARMUP: 'warn', KNIFE: 'warn', KNIFE_DECISION: 'warn', LIVE: 'ok',
  PAUSED: 'warn', HALFTIME: 'warn', OVERTIME: 'ok', FINISHED: 'neutral', CANCELLED: 'danger',
};
const LIVE_STATES = ['WARMUP', 'KNIFE', 'KNIFE_DECISION', 'LIVE', 'PAUSED', 'HALFTIME', 'OVERTIME'];
export const formatScore = (v) => String(v).padStart(2, '0');

const th = { padding: 'var(--space-5) var(--space-6)', font: 'var(--type-small)', fontWeight: 'var(--weight-regular)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-faint)' };
const td = { padding: 'var(--space-5) var(--space-6)', fontSize: 'var(--text-base)' };

export function MatchTable({ rows = [], onOpen, emptyTitle = 'Nothing running', emptyDescription = 'Start a match from an instance and it shows up here while it is live.' }) {
  const [showScores, setShowScores] = React.useState(true);
  const [live, setLive] = React.useState(true);
  return (
    <div style={{ borderRadius: 'var(--radius-xl)', border: 'var(--border-w) solid var(--border-1)', background: 'var(--surface-card)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-10)', borderBottom: 'var(--border-w) solid var(--border-1)', padding: 'var(--space-6) var(--pad-card-x)' }}>
        <Checkbox label="Display scores" checked={showScores} onChange={(e) => setShowScores(e.target.checked)} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Checkbox label="Live refresh" checked={live} onChange={(e) => setLive(e.target.checked)} />
          <span style={{ font: 'var(--type-small)', color: 'var(--text-faint)' }}>every 10s</span>
        </span>
      </div>
      {rows.length === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left' }}>#ID</th>
              <th style={{ ...th, textAlign: 'right' }}>Team 1</th>
              <th style={{ ...th, textAlign: 'center' }}>Score</th>
              <th style={{ ...th, textAlign: 'left' }}>Team 2</th>
              <th style={{ ...th, textAlign: 'left' }}>Map</th>
              <th style={{ ...th, textAlign: 'left' }}>Server</th>
              <th style={{ ...th, textAlign: 'left' }}>Status</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => <Row key={row.id} row={row} showScores={showScores} onOpen={onOpen} />)}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Row({ row, showScores, onOpen }) {
  const [hover, setHover] = React.useState(false);
  const t1 = row.team1Score > row.team2Score, t2 = row.team2Score > row.team1Score;
  return (
    <tr
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ borderTop: 'var(--border-w) solid var(--ink-800)', background: hover ? 'var(--surface-2)' : 'transparent', transition: 'var(--transition-color)' }}
    >
      <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>#{row.shortId}</td>
      <td style={{ ...td, textAlign: 'right', color: t1 ? 'var(--text-strong)' : 'var(--text-muted)' }}>{row.team1Name}</td>
      <td className="tabular" style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
        {showScores ? (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-strong)' }}>
            {formatScore(row.team1Score)}<span style={{ padding: '0 4px', color: 'var(--text-faint)' }}>-</span>{formatScore(row.team2Score)}
          </span>
        ) : <span style={{ color: 'var(--text-faint)' }}>hidden</span>}
      </td>
      <td style={{ ...td, color: t2 ? 'var(--text-strong)' : 'var(--text-muted)' }}>{row.team2Name}</td>
      <td style={{ ...td, color: 'var(--text-muted)' }}>{row.map}</td>
      <td style={{ ...td, fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{row.serverName} · {row.instanceName}</td>
      <td style={td}>
        <Badge tone={STATE_TONE[row.state]} live={LIVE_STATES.includes(row.state) && row.state !== 'PAUSED'}>{STATE_LABEL[row.state]}</Badge>
      </td>
      <td style={{ ...td, textAlign: 'right' }}>
        <Chip as="button" onClick={() => onOpen && onOpen(row)}>Show</Chip>
      </td>
    </tr>
  );
}
