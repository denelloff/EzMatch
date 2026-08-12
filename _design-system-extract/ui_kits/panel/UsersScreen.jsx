const { Card, CardHeader, Badge, Button } = window.EZMatchDesignSystem_ab9a05;

const USERS = [
  ['denelloff', 'admin@ezmatch.gg', 'OWNER', true, false, true],
  ['kirill', 'kirill@ezmatch.gg', 'ADMIN', true, false, false],
  ['operator-eu', 'eu@ezmatch.gg', 'OPERATOR', false, false, false],
  ['operator-na', 'na@ezmatch.gg', 'OPERATOR', false, true, false],
  ['viewer', 'stats@ezmatch.gg', 'USER', false, false, false],
];

function UsersScreen({ go }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
        <div>
          <h1 style={{ margin: 0, font: 'var(--type-h1)', color: 'var(--text-strong)' }}>Users</h1>
          <p style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Accounts that can sign in to this panel, and what each one is allowed to do.</p>
        </div>
        <Button>Create user</Button>
      </div>

      <Card>
        <CardHeader title="Accounts" description={USERS.length + ' users'} />
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {USERS.map(([name, email, role, canCreate, disabled, self], i) => (
            <li key={email} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', borderTop: i ? 'var(--border-w) solid var(--border-1)' : 0, padding: 'var(--space-6) var(--pad-card-x)' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)', color: 'var(--text-strong)' }}>
                  {name}<span style={{ marginLeft: 'var(--space-4)', fontWeight: 'var(--weight-regular)', color: 'var(--text-faint)' }}>{email}</span>
                  {self ? <span style={{ marginLeft: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>(you)</span> : null}
                </p>
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <Badge tone={role === 'OWNER' ? 'brand' : 'neutral'}>{role}</Badge>
                  {canCreate ? <Badge tone="info">can create users</Badge> : null}
                  {disabled ? <Badge tone="danger">disabled</Badge> : null}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <Button variant="secondary" size="sm">{self ? 'Edit profile' : 'Edit'}</Button>
                {role !== 'OWNER' ? <Button variant="danger" size="sm">Delete</Button> : <span style={{ font: 'var(--type-small)', color: 'var(--ink-500)', alignSelf: 'center' }}>locked</span>}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
Object.assign(window, { UsersScreen });
