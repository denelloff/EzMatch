const { Card, CardHeader, CardBody, Field, Input, Select, Checkbox, Button, Badge, Chip } = window.EZMatchDesignSystem_ab9a05;

const MAPS = [
  ['de_ancient', 'Ancient', 'ACTIVE_DUTY', true],
  ['de_anubis', 'Anubis', 'ACTIVE_DUTY', true],
  ['de_cache', 'Cache', 'ACTIVE_DUTY', true],
  ['de_dust2', 'Dust II', 'ACTIVE_DUTY', true],
  ['de_inferno', 'Inferno', 'ACTIVE_DUTY', true],
  ['de_mirage', 'Mirage', 'ACTIVE_DUTY', true],
  ['de_nuke', 'Nuke', 'ACTIVE_DUTY', true],
  ['de_overpass', 'Overpass', 'COMPETITIVE', true],
  ['de_train', 'Train', 'COMPETITIVE', true],
  ['de_vertigo', 'Vertigo', 'COMPETITIVE', false],
  ['de_thera', 'Thera', 'CUSTOM', false],
];
const POOLS = ['All', 'Active duty', 'Competitive', 'Custom'];

function SettingsScreen() {
  const [pool, setPool] = React.useState('All');
  const [saved, setSaved] = React.useState(false);
  const visible = MAPS.filter((m) => pool === 'All' || (pool === 'Active duty' && m[2] === 'ACTIVE_DUTY') || (pool === 'Competitive' && m[2] === 'COMPETITIVE') || (pool === 'Custom' && m[2] === 'CUSTOM'));
  return (
    <div style={{ margin: '0 auto', maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
        <div>
          <h1 style={{ margin: 0, font: 'var(--type-h2)', fontSize: 'var(--text-md)', color: 'var(--text-strong)' }}>Settings</h1>
          <p style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Defaults applied to every new match, and the map pool operators can pick from.</p>
        </div>
        <nav style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Chip href="#">Match defaults</Chip>
          <Chip href="#">Maps</Chip>
        </nav>
      </header>

      <Card>
        <CardHeader title="Match defaults" description="Pre-filled when a match is created. Individual matches can still override them." />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-12)' }}>
            <Field label="Freezetime" hint="Seconds before each LIVE round (Valve competitive = 15)."><Input type="number" defaultValue={15} /></Field>
            <Field label="Tactical pause" hint="!pause length in seconds."><Input type="number" defaultValue={30} /></Field>
            <Field label="Pauses / team" hint="!pause uses per team in regulation."><Input type="number" defaultValue={4} /></Field>
            <Field label="Pauses in OT" hint="!pause uses per team in overtime."><Input type="number" defaultValue={2} /></Field>
            <Field label="Tech pause budget" hint="Shared !tech seconds for the match (default 600)."><Input type="number" defaultValue={600} /></Field>
            <Field label="Overtime MR" hint="MR3 = 6 total OT rounds, MR5 = 10."><Select options={[{ value: '3', label: 'MR3' }, { value: '5', label: 'MR5' }]} defaultValue="3" /></Field>
          </div>
          <div style={{ marginTop: 'var(--space-12)', display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <Button onClick={() => setSaved(true)}>Save defaults</Button>
            {saved ? <span style={{ font: 'var(--type-small)', color: 'var(--ok-500)' }}>Saved</span> : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Maps" description="Disabled maps stay in the database but disappear from the match form." />
        <CardBody>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {POOLS.map((p) => <Chip key={p} as="button" active={p === pool} onClick={() => setPool(p)}>{p}</Chip>)}
            </div>
            <Input type="search" placeholder="Search maps" style={{ width: 200 }} />
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, border: 'var(--border-w) solid var(--border-1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {visible.map(([name, label, mpool, enabled], i) => (
              <li key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)', borderTop: i ? 'var(--border-w) solid var(--ink-800)' : 0, background: 'var(--surface-inset)', padding: 'var(--space-5) var(--space-8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', minWidth: 0 }}>
                  <Checkbox defaultChecked={enabled} />
                  <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-strong)' }}>{label}</span>
                  <span className="console-surface" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                  <Badge tone={mpool === 'ACTIVE_DUTY' ? 'brand' : mpool === 'COMPETITIVE' ? 'neutral' : 'info'}>{mpool === 'ACTIVE_DUTY' ? 'active duty' : mpool.toLowerCase()}</Badge>
                  <span style={{ font: 'var(--type-small)', color: enabled ? 'var(--ok-500)' : 'var(--text-faint)' }}>{enabled ? 'enabled' : 'disabled'}</span>
                  <Button variant="danger" size="sm">Delete</Button>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 'var(--space-10)', display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 'var(--space-8)', alignItems: 'end' }}>
            <Field label="Map name" hint="Lowercase, e.g. de_cbble."><Input placeholder="de_cbble" /></Field>
            <Field label="Display label"><Input placeholder="Cobblestone" /></Field>
            <Field label="Pool"><Select options={[{ value: 'CUSTOM', label: 'Custom' }, { value: 'COMPETITIVE', label: 'Competitive' }]} defaultValue="CUSTOM" /></Field>
            <Button variant="secondary">Add map</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
Object.assign(window, { SettingsScreen });
