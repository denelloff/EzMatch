const { Card, CardHeader, Badge, Button, Chip, Scoreboard, Input, Notice } = window.EZMatchDesignSystem_ab9a05;

const STATE_HINT = {
  DRAFT: 'Nothing has been sent to the server yet. Preparing applies the match convars and changes the map.',
  WARMUP: 'Warmup is frozen. After streamers unlock, both teams type !ready or !r to start (or force Go live).',
  KNIFE: 'Knife round in progress. The winner picks a side when it ends.',
  KNIFE_DECISION: 'Knife winners: type !stay or !switch (or use the panel buttons).',
  LIVE: 'Match is live. The score comes from the server, not from eZ-Match counting rounds.',
  PAUSED: 'Paused. CS2 applies the pause at the end of the current round.',
  FINISHED: 'Match finished.',
};

const LOG = [
  '> mp_backup_restore_load_file backup_round21.txt',
  'L 21:04:11: World triggered "Round_End" (CT "12") (T "9")',
  'L 21:04:11: Team "CT" triggered "SFUI_Notice_Bomb_Defused" (CT "12") (T "9")',
  'L 21:04:03: "b1t<4><STEAM_1:1:143210>" triggered "Begin_Bomb_Defuse_With_Kit"',
  'L 21:03:47: "ropz<9>" [1204 -320 64] killed "jL<4>" [980 -112 64] with "ak47" (headshot)',
  'L 21:03:41: "b1t<4>" [512 88 -40] killed "broky<7>" [1420 -60 12] with "awp"',
  'L 21:02:58: World triggered "Round_Start"',
  'L 21:02:40: "karrigan<11>" say "nice one"',
];

const TABS = ['Scoreboard', 'Chat', 'Backup', 'Control', 'Server'];

function ControlRoomScreen({ match, onBack }) {
  const [tab, setTab] = React.useState('Control');
  const [state, setState] = React.useState('LIVE');
  const [copied, setCopied] = React.useState(false);
  const [backups, setBackups] = React.useState(null);
  const d = window.EZ_DATA;

  return (
    <div style={{ margin: '0 auto', maxWidth: 'var(--content-max)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Card inset>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-8)', padding: 'var(--space-7) var(--space-8)' }}>
          <div style={{ minWidth: 0 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{ font: 'var(--type-small)', color: 'var(--text-faint)' }}>← My matches</a>
            <h1 style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-h1)', color: 'var(--text-strong)' }}>
              <span style={{ marginRight: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--ink-500)' }}>#{match.shortId}</span>
              {match.team1Name} vs {match.team2Name}
            </h1>
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {[match.map, match.instanceName, 'started 34 minutes ago', 'instance', 'edit'].map((m) => (
                <span key={m} style={{ borderRadius: 'var(--radius-sm)', border: 'var(--border-w) solid var(--border-1)', background: 'var(--surface-1)', padding: '1px 8px', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{m}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
            {state === 'LIVE' ? <Button variant="secondary" size="sm" onClick={() => setState('PAUSED')}>Pause</Button> : null}
            {state === 'PAUSED' ? <Button size="sm" onClick={() => setState('LIVE')}>Resume</Button> : null}
            {state === 'WARMUP' ? <Button size="sm" onClick={() => setState('KNIFE')}>Start knife round</Button> : null}
            <Button variant="danger" size="sm" onClick={() => setState('FINISHED')}>Cancel match</Button>
          </div>
        </div>
        <div style={{ borderTop: 'var(--border-w) solid var(--ink-800)', padding: 'var(--space-6) var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          <code className="console-surface" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>connect 51.83.44.10:27015; password "scrim"</code>
          <Button variant="secondary" size="sm" onClick={() => setCopied(true)}>{copied ? 'Copied' : 'Copy connect'}</Button>
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', borderRadius: 'var(--radius-lg)', border: 'var(--border-w) solid var(--border-1)', background: 'var(--surface-card)', padding: 'var(--space-5) var(--space-8)' }}>
        <Badge tone={state === 'LIVE' ? 'ok' : state === 'FINISHED' ? 'neutral' : 'warn'} live={state === 'LIVE'}>{state.toLowerCase().replace(/_/g, ' ')}</Badge>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-faint)' }}>{STATE_HINT[state]}</p>
        <span className="tabular" style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xl)', color: 'var(--text-strong)' }}>
          <span style={{ color: 'var(--side-ct)' }}>{match.team1Score}</span>
          <span style={{ margin: '0 8px', color: 'var(--ink-600)' }}>:</span>
          <span style={{ color: 'var(--side-t)' }}>{match.team2Score}</span>
        </span>
        <span style={{ font: 'var(--type-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-vs)', color: 'var(--text-faint)' }}>MR12</span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            cursor: 'pointer', border: 'var(--border-w) solid ' + (t === tab ? 'var(--brand-hair)' : 'var(--border-1)'),
            background: t === tab ? 'var(--brand-wash)' : 'var(--surface-1)', borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4) var(--space-7)', fontSize: 'var(--text-sm)',
            color: t === tab ? 'var(--brand-500)' : 'var(--text-muted)', transition: 'var(--transition-color)',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'Control' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Card inset>
            <CardHeader title="Console" description="rcon output, newest at the bottom." />
            <pre className="console-surface" style={{ margin: 0, maxHeight: 300, overflow: 'auto', padding: 'var(--space-8)', fontSize: 'var(--text-xs)', lineHeight: 1.7, color: 'var(--text-muted)' }}>{LOG.join('\n')}</pre>
            <div style={{ display: 'flex', gap: 'var(--space-4)', borderTop: 'var(--border-w) solid var(--ink-800)', padding: 'var(--space-6) var(--space-8)' }}>
              <Input placeholder="rcon command" style={{ fontFamily: 'var(--font-mono)' }} />
              <Button size="sm">Send</Button>
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Card>
              <CardHeader title="Round backups" description="Loads a round backup with mp_backup_restore_load_file, then pauses the match." action={<Button variant="secondary" size="sm" onClick={() => setBackups(['backup_round19.txt', 'backup_round20.txt', 'backup_round21.txt'])}>List backups</Button>} />
              <div style={{ padding: 'var(--pad-card-y) var(--pad-card-x)' }}>
                {backups === null ? (
                  <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-faint)' }}>CS2 writes one backup at the start of each round once the match is live.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    {backups.map((b) => <Chip key={b} as="button" style={{ fontFamily: 'var(--font-mono)' }}>{b}</Chip>)}
                  </div>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="Demos" description="GOTV recordings pulled from the agent." action={<Chip as="button">Sync now</Chip>} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', padding: 'var(--pad-card-y) var(--pad-card-x)' }}>
                <Chip href="#" style={{ fontFamily: 'var(--font-mono)' }}>match_a41f_de_mirage.dem <span style={{ marginLeft: 6, color: 'var(--text-faint)' }}>241 MB</span></Chip>
                <Chip href="#" style={{ fontFamily: 'var(--font-mono)' }}>match_a41f_de_mirage.json <span style={{ marginLeft: 6, color: 'var(--text-faint)' }}>1.2 MB</span></Chip>
              </div>
            </Card>
            <Notice tone="warn">Waiting for GOTV delay — a new match on fra-01 is blocked for 105 more seconds so the demo is not cut off.</Notice>
          </div>
        </div>
      ) : tab === 'Scoreboard' ? (
        <Scoreboard map={match.map} state={state} maxRounds={24} team1Side="CT" roundsPlayed={21}
          team1={{ name: match.team1Name, score: match.team1Score, logo: match.team1Logo, players: d.players1 }}
          team2={{ name: match.team2Name, score: match.team2Score, logo: match.team2Logo, players: d.players2 }} />
      ) : tab === 'Chat' ? (
        <Card inset>
          <CardHeader title="In-game chat" description="Everything both teams say, plus admin calls." />
          <ul style={{ listStyle: 'none', margin: 0, padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {[['21:02:40', 'karrigan', 'T', 'nice one'], ['21:01:58', 'b1t', 'CT', '!ready'], ['21:01:52', 'Aleksib', 'CT', '!ready'], ['20:58:11', 'ropz', 'T', '!admin plugin lag'], ['20:57:04', 'jL', 'CT', 'gl hf']].map(([t, who, side, msg], i) => (
              <li key={i} style={{ display: 'flex', gap: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
                <span className="console-surface" style={{ width: 64, flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>{t}</span>
                <span style={{ width: 90, flexShrink: 0, color: side === 'CT' ? 'var(--side-ct)' : 'var(--side-t)' }}>{who}</span>
                <span style={{ color: 'var(--text-muted)' }}>{msg}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <CardHeader title={tab} action={<Badge tone="neutral">Coming soon</Badge>} />
          <p style={{ margin: 0, padding: 'var(--space-24) var(--pad-card-x)', textAlign: 'center', font: 'var(--type-body)', color: 'var(--text-faint)' }}>
            Left intentionally blank — no design exists for this tab in the source panel.
          </p>
        </Card>
      )}
    </div>
  );
}
Object.assign(window, { ControlRoomScreen });
