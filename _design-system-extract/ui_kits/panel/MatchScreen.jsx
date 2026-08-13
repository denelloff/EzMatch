const { Scoreboard, Card, CardHeader, EventFeed, Chip, Badge } = window.EZMatchDesignSystem_ab9a05;

const TABS = ['Scoreboard', 'Match statistics', 'Player statistics', 'Weapon statistics', 'Killer / Killed', 'Heatmap', 'Demos'];

function MatchScreen({ match, onBack }) {
  const [tab, setTab] = React.useState('Scoreboard');
  const d = window.EZ_DATA;
  return (
    <div style={{ margin: '0 auto', maxWidth: 'var(--reading-max)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div>
        <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{ font: 'var(--type-small)', color: 'var(--text-faint)' }}>← Matches in progress</a>
        <h1 style={{ margin: 'var(--space-4) 0 0', font: 'var(--type-h1)', color: 'var(--text-strong)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-faint)' }}>#{match.shortId}</span>{' '}
          {match.team1Name} vs {match.team2Name}
        </h1>
        <p style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>
          {match.map} · {match.instanceName} · started 34 minutes ago
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', borderBottom: 'var(--border-w) solid var(--border-1)', paddingBottom: 'var(--space-4)' }}>
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            cursor: 'pointer', border: 0, background: t === tab ? 'var(--surface-2)' : 'transparent',
            borderBottom: '2px solid ' + (t === tab ? 'var(--brand-500)' : 'transparent'),
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: 'var(--space-4) var(--space-6)',
            fontSize: 'var(--text-sm)', color: t === tab ? 'var(--text-strong)' : 'var(--text-faint)',
            transition: 'var(--transition-color)',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'Scoreboard' ? (
        <Scoreboard
          map={match.map} state={match.state} maxRounds={24} team1Side="CT" roundsPlayed={21}
          team1={{ name: match.team1Name, score: match.team1Score, logo: match.team1Logo, players: d.players1 }}
          team2={{ name: match.team2Name, score: match.team2Score, logo: match.team2Logo, players: d.players2 }}
        />
      ) : tab === 'Demos' ? (
        <Card>
          <CardHeader title="Demos" description="GOTV recordings pulled from the agent once the match ends." action={<Chip as="button">Sync now</Chip>} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', padding: 'var(--pad-card-y) var(--pad-card-x)' }}>
            <Chip href="#">match_a41f_de_mirage.dem <span style={{ marginLeft: 6, color: 'var(--text-faint)' }}>241 MB</span></Chip>
            <Chip href="#">match_a41f_de_mirage.json <span style={{ marginLeft: 6, color: 'var(--text-faint)' }}>1.2 MB</span></Chip>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title={tab} description="Recorded once the match ends. This view is not part of the current build." action={<Badge tone="neutral">Coming soon</Badge>} />
          <p style={{ margin: 0, padding: 'var(--space-24) var(--pad-card-x)', textAlign: 'center', font: 'var(--type-body)', color: 'var(--text-faint)' }}>
            Left intentionally blank — no design exists for this tab in the source panel.
          </p>
        </Card>
      )}

      <Card>
        <CardHeader title="Server events" description={match.serverName + ' · ' + match.instanceName} />
        <EventFeed events={d.events} maxHeight={220} />
      </Card>
    </div>
  );
}
Object.assign(window, { MatchScreen });
