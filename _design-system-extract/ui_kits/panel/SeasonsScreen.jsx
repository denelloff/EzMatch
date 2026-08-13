const { Card, CardHeader, Badge, Button, EmptyState } = window.EZMatchDesignSystem_ab9a05;

function SeasonsScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <div>
        <h1 style={{ margin: 0, font: 'var(--type-h1)', color: 'var(--text-strong)' }}>Seasons overview</h1>
        <p style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>This section is on the roadmap. The menu is in place so the admin shell matches the eBot layout.</p>
      </div>
      <Card>
        <CardHeader title="Seasons" action={<Badge tone="neutral">Coming soon</Badge>} />
        <EmptyState
          title="Coming soon"
          description="No season model exists in the database yet, so nothing is designed here. Leaving it blank on purpose rather than inventing a layout."
          action={<Button variant="secondary" size="sm">Back to matches</Button>}
        />
      </Card>
    </div>
  );
}
Object.assign(window, { SeasonsScreen });
