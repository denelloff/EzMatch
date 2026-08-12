const { MatchTable, Card, CardHeader, Chip } = window.EZMatchDesignSystem_ab9a05;

function PageHead({ title, description, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
      <div>
        <h1 style={{ margin: 0, font: 'var(--type-h1)', color: 'var(--text-strong)' }}>{title}</h1>
        <p style={{ margin: '2px 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>{description}</p>
      </div>
      {right}
    </div>
  );
}

function MatchesScreen({ rows, onOpen, archive = false }) {
  return (
    <div>
      <PageHead
        title={archive ? 'Archived matches' : 'Matches in progress'}
        description={archive
          ? 'Every match ever created on this panel, newest first. Statistics stay available after a match ends.'
          : 'Everything currently held on a server, plus matches created but not started yet.'}
        right={!archive ? <a href="#" style={{ font: 'var(--type-body)', color: 'var(--text-faint)' }}>Display all matches →</a> : null}
      />
      <MatchTable rows={rows} onOpen={onOpen} />
      {!archive ? (
        <div style={{ marginTop: 'var(--space-12)' }}>
          <Card>
            <CardHeader title="Free servers" description="Running instances with no match attached." />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', padding: 'var(--pad-card-y) var(--pad-card-x)' }}>
              {[['ams-02','retake','de_dust2'], ['fra-03','main','de_anubis'], ['nyc-02','scrim','de_train']].map(([s, i, m]) => (
                <Chip key={s} href="#">{s} · {i}<span style={{ marginLeft: 6, color: 'var(--text-faint)' }}>{m}</span></Chip>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
Object.assign(window, { MatchesScreen, PageHead });
