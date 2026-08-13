import React from 'react';
import { Badge } from '../core/Badge.jsx';

export function Scoreboard({ map, state = 'LIVE', maxRounds = 24, team1, team2, team1Side = 'CT', roundsPlayed = 0, spectators }) {
  const ctFirst = team1Side === 'CT';
  const round = (team1.score || 0) + (team2.score || 0);
  return (
    <div style={{ borderRadius: 'var(--radius-2xl)', border: 'var(--border-w) solid var(--border-1)', background: 'var(--surface-inset)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', borderBottom: 'var(--border-w) solid var(--ink-800)', padding: 'var(--space-8) var(--pad-card-x)' }}>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>
          <span style={{ font: 'var(--type-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-vs)', color: 'var(--text-faint)' }}>Round</span>
          <span className="tabular" style={{ marginLeft: 'var(--space-4)', color: 'var(--text-strong)' }}>{round}</span>
          <span style={{ margin: '0 var(--space-4)', color: 'var(--ink-600)' }}>·</span>
          <span style={{ color: 'var(--text-strong)' }}>{map}</span>
        </p>
        <div className="tabular" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-6)', font: 'var(--type-score)' }}>
          <span style={{ color: ctFirst ? 'var(--side-ct)' : 'var(--side-t)' }}>{team1.score}</span>
          <span style={{ fontSize: 'var(--text-lg)', color: 'var(--ink-600)' }}>:</span>
          <span style={{ color: ctFirst ? 'var(--side-t)' : 'var(--side-ct)' }}>{team2.score}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{ font: 'var(--type-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-vs)', color: 'var(--text-faint)' }}>MR{maxRounds / 2}</span>
          <Badge tone={state === 'LIVE' || state === 'OVERTIME' ? 'ok' : state === 'CANCELLED' ? 'danger' : state === 'FINISHED' ? 'neutral' : 'warn'} live={state === 'LIVE'}>
            {state.toLowerCase().replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
      <TeamBlock team={team1} side={ctFirst ? 'CT' : 'T'} roundsPlayed={roundsPlayed} />
      <div style={{ borderTop: 'var(--border-w) solid var(--ink-800)', borderBottom: 'var(--border-w) solid var(--ink-800)', background: 'var(--surface-1)', padding: 'var(--space-5) var(--pad-card-x)' }}>
        <p style={{ margin: 0, textAlign: 'center', font: 'var(--type-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-vs)', color: 'var(--text-faint)' }}>vs</p>
      </div>
      <TeamBlock team={team2} side={ctFirst ? 'T' : 'CT'} roundsPlayed={roundsPlayed} />
      {spectators && spectators.length ? <TeamBlock team={{ name: 'Unassigned / Spectators', players: spectators }} side="—" roundsPlayed={roundsPlayed} /> : null}
    </div>
  );
}

const th = { padding: 'var(--space-4) var(--space-4)', font: 'var(--type-eyebrow)', fontWeight: 'var(--weight-regular)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-faint)' };

function TeamBlock({ team, side, roundsPlayed }) {
  const tone = side === 'CT' ? { bg: 'var(--side-ct-wash)', fg: 'var(--side-ct)' } : side === 'T' ? { bg: 'var(--side-t-wash)', fg: 'var(--side-t)' } : { bg: 'var(--surface-3)', fg: 'var(--text-muted)' };
  const players = team.players || [];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', background: tone.bg, color: tone.fg, padding: 'var(--space-5) var(--pad-card-x)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>
          {team.logo ? <img src={team.logo} alt="" width="20" height="20" style={{ display: 'block', objectFit: 'contain' }} /> : null}
          {team.name}
        </span>
        <span style={{ font: 'var(--type-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-vs)', opacity: .85 }}>{side}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left', paddingLeft: 'var(--pad-card-x)' }}>Player</th>
            <th style={{ ...th, textAlign: 'right' }}>K</th>
            <th style={{ ...th, textAlign: 'right' }}>A</th>
            <th style={{ ...th, textAlign: 'right' }}>D</th>
            <th style={{ ...th, textAlign: 'right', paddingRight: 'var(--pad-card-x)' }}>ADR</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr><td colSpan="5" style={{ padding: 'var(--space-16)', textAlign: 'center', font: 'var(--type-small)', color: 'var(--text-faint)' }}>Waiting for players…</td></tr>
          ) : players.map((p) => (
            <tr key={p.name} style={{ borderTop: 'var(--border-w) solid var(--ink-800)' }}>
              <td style={{ padding: 'var(--space-5) var(--pad-card-x)', fontSize: 'var(--text-base)', color: p.connected === false ? 'var(--ink-500)' : 'var(--text-strong)' }}>{p.name}</td>
              <td className="tabular" style={{ padding: 'var(--space-5) var(--space-4)', textAlign: 'right', color: 'var(--text-body)' }}>{p.kills}</td>
              <td className="tabular" style={{ padding: 'var(--space-5) var(--space-4)', textAlign: 'right', color: 'var(--text-body)' }}>{p.assists}</td>
              <td className="tabular" style={{ padding: 'var(--space-5) var(--space-4)', textAlign: 'right', color: 'var(--text-body)' }}>{p.deaths}</td>
              <td className="tabular" style={{ padding: 'var(--space-5) var(--pad-card-x)', textAlign: 'right', color: 'var(--text-faint)' }}>{roundsPlayed > 0 ? (p.damage / roundsPlayed).toFixed(1) : '0.0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
