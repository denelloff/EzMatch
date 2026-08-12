const { Card, CardHeader, Badge, Button, Notice } = window.EZMatchDesignSystem_ab9a05;

const TEAMS = [
  ['Natus Vincere', 'NAVI', 'ua', 'Ukraine', 'navi', true],
  ['FaZe Clan', 'FAZE', 'us', 'United States', 'faze', true],
  ['Team Vitality', 'VIT', 'fr', 'France', 'vitality', true],
  ['Team Spirit', 'SPIRIT', 'ru', 'Russia', 'spirit', true],
  ['G2 Esports', 'G2', 'de', 'Germany', 'g2', true],
  ['MOUZ', 'MOUZ', 'de', 'Germany', 'mouz', true],
  ['Team Liquid', 'TL', 'us', 'United States', 'liquid', true],
  ['Astralis', 'AST', 'dk', 'Denmark', 'astralis', true],
];

function TeamsScreen({ go }) {
  const [imported, setImported] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
        <div>
          <h1 style={{ margin: 0, font: 'var(--type-h1)', color: 'var(--text-strong)' }}>Team management</h1>
          <p style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Edit or delete teams, or import a preset of known CS2 organisations.</p>
        </div>
        <Button onClick={() => go && go('admin-team-new')}>Create team</Button>
      </div>

      <Card>
        <CardHeader title="CS2 pro preset" description="Import well-known professional CS2 teams with real logos (cached locally; you can replace them later)." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', padding: 'var(--pad-card-y) var(--pad-card-x)' }}>
          <Button variant="secondary" onClick={() => setImported(true)}>Load CS2 pro teams</Button>
          <p style={{ margin: 0, font: 'var(--type-small)', color: 'var(--text-faint)' }}>Already imported organisations are skipped. Logos are generated badges you can replace.</p>
        </div>
        {imported ? <div style={{ padding: '0 var(--pad-card-x) var(--pad-card-y)' }}><Notice tone="info">Imported 46, skipped 8, repaired logos 3.</Notice></div> : null}
      </Card>

      <Card>
        <CardHeader title="Teams" description={TEAMS.length + ' teams'} />
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {TEAMS.map(([name, tag, cc, country, slug, preset], i) => (
            <li key={tag} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', borderTop: i ? 'var(--border-w) solid var(--border-1)' : 0, padding: 'var(--space-6) var(--pad-card-x)' }}>
              <div style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 'var(--space-6)' }}>
                <div style={{ display: 'flex', height: 40, width: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: 'var(--border-w) solid var(--border-1)', background: 'var(--surface-2)' }}>
                  <img src={'../../assets/teams/' + slug + '.png'} alt="" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--text-strong)' }}>{name} <span style={{ color: 'var(--text-faint)' }}>({tag})</span></p>
                  <p style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
                    <span className="console-surface">{cc}</span>
                    <span>{country}</span>
                    {preset ? <Badge tone="info">preset</Badge> : null}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexShrink: 0, gap: 'var(--space-4)' }}>
                <Button variant="secondary" size="sm">Edit</Button>
                <Button variant="danger" size="sm">Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
Object.assign(window, { TeamsScreen });
