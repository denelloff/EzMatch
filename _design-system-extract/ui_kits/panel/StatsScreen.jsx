const { Card, CardHeader, StatTile, EmptyState } = window.EZMatchDesignSystem_ab9a05;

const th = { padding: 'var(--space-4) var(--space-6)', font: 'var(--type-small)', fontWeight: 'var(--weight-regular)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-faint)' };
const td = { padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-base)' };

function StatsScreen() {
  const rows = window.EZ_DATA.leaderboard;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <div>
        <h1 style={{ margin: 0, font: 'var(--type-h1)', color: 'var(--text-strong)' }}>Global statistics</h1>
        <p style={{ margin: '2px 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Totals across every match this panel has run.</p>
      </div>

      <Card>
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: 0 }}>
          <StatTile label="Matches" value={128} />
          <StatTile label="Finished" value={119} />
          <StatTile label="Rounds played" value={3104} />
          <StatTile label="Kills recorded" value={24871} tone="brand" />
        </dl>
      </Card>

      <Card>
        <CardHeader title="Top players" description="By total kills, across all matches. Showing up to 25." />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left' }}>Player</th>
              <th style={{ ...th, textAlign: 'right' }}>Matches</th>
              <th style={{ ...th, textAlign: 'right' }}>K</th>
              <th style={{ ...th, textAlign: 'right' }}>D</th>
              <th style={{ ...th, textAlign: 'right' }}>A</th>
              <th style={{ ...th, textAlign: 'right' }}>K/D</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, steam, matches, kills, deaths, assists]) => (
              <tr key={steam} style={{ borderTop: 'var(--border-w) solid var(--ink-800)' }}>
                <td style={{ ...td, color: 'var(--text-body)' }}>
                  {name}
                  <span style={{ marginLeft: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{steam}</span>
                </td>
                <td className="tabular" style={{ ...td, textAlign: 'right', color: 'var(--text-faint)' }}>{matches}</td>
                <td className="tabular" style={{ ...td, textAlign: 'right', color: 'var(--text-strong)' }}>{kills}</td>
                <td className="tabular" style={{ ...td, textAlign: 'right', color: 'var(--text-faint)' }}>{deaths}</td>
                <td className="tabular" style={{ ...td, textAlign: 'right', color: 'var(--text-faint)' }}>{assists}</td>
                <td className="tabular" style={{ ...td, textAlign: 'right', color: 'var(--text-muted)' }}>{(kills / deaths).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader title="Statistics by weapon" />
        <EmptyState title="Nothing recorded yet" description="Weapon totals build up as matches are played on this panel." />
      </Card>
    </div>
  );
}
Object.assign(window, { StatsScreen });
