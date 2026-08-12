const { MatchTable, Card, CardHeader, Chip, TaskProgress, StatTile } = window.EZMatchDesignSystem_ab9a05;

function AdminHomeScreen({ rows, onOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
        <div>
          <h1 style={{ margin: 0, font: 'var(--type-h1)', color: 'var(--text-strong)' }}>Matches in progress</h1>
          <p style={{ margin: '2px 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Everything currently held on a server, plus matches created but not started yet.</p>
        </div>
        <a href="#" style={{ font: 'var(--type-body)', color: 'var(--text-faint)' }}>Display all matches →</a>
      </div>

      <Card>
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: 0 }}>
          <StatTile label="Live matches" value={2} tone="ok" />
          <StatTile label="Drafts" value={1} />
          <StatTile label="Running instances" value={6} />
          <StatTile label="Agents online" value="4 / 4" tone="brand" />
        </dl>
      </Card>

      <MatchTable rows={rows} onOpen={onOpen} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
        <Card>
          <CardHeader title="Free servers" description="Running instances with no match attached." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', padding: 'var(--pad-card-y) var(--pad-card-x)' }}>
            {[['ams-02', 'retake', 'de_dust2'], ['fra-03', 'main', 'de_anubis'], ['nyc-02', 'scrim', 'de_train']].map(([s, i, m]) => (
              <Chip key={s} href="#">{s} · {i}<span style={{ marginLeft: 6, color: 'var(--text-faint)' }}>{m}</span></Chip>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Tasks" description="Agent deploys and demo syncs." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)', padding: 'var(--pad-card-y) var(--pad-card-x)' }}>
            <TaskProgress label="Deploying ez-agent to fra-01" percent={64} eta="~40s left" />
            <TaskProgress label="Syncing demos · nyc-01" percent={100} state="done" />
            <TaskProgress label="Backup restore · ams-01" percent={38} state="failed" />
          </div>
        </Card>
      </div>
    </div>
  );
}
Object.assign(window, { AdminHomeScreen });
