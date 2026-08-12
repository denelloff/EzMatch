const { Card, CardHeader, Badge, Button, EmptyState } = window.EZMatchDesignSystem_ab9a05;

const th = { padding: 'var(--space-6) var(--space-6)', textAlign: 'left', font: 'var(--type-small)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-faint)' };
const td = { padding: 'var(--space-7) var(--space-6)', fontSize: 'var(--text-base)', verticalAlign: 'top' };

const AGENTS = [
  { name: 'fra-01', host: '51.83.44.10:22', region: 'eu-west', status: 'ONLINE', version: '0.4.2', seen: '12 seconds ago', disk: '184.2 GB', instances: 3, running: 2 },
  { name: 'ams-01', host: '89.106.12.7:22', region: 'eu-central', status: 'ONLINE', version: '0.4.2', seen: '31 seconds ago', disk: '96.8 GB', instances: 2, running: 1 },
  { name: 'nyc-01', host: '167.71.4.201:2222', region: 'us-east', status: 'PENDING', version: null, seen: '4 minutes ago', disk: '512.0 GB', instances: 1, running: 1 },
  { name: 'sgp-01', host: '128.199.88.4:22', region: 'ap-south', status: 'OFFLINE', version: '0.3.9', seen: '2 days ago', disk: '—', instances: 0, running: 0, error: 'ssh: handshake failed after 3 attempts' },
];

const INSTANCES = [
  { name: 'main', title: 'eZ-Match · fra-01 main', host: 'fra-01', addr: '51.83.44.10', port: 27015, tv: 27020, state: 'RUNNING' },
  { name: 'retake', title: 'eZ-Match · fra-01 retake', host: 'fra-01', addr: '51.83.44.10', port: 27025, tv: 27030, state: 'RUNNING' },
  { name: 'scrim', title: 'eZ-Match · fra-01 scrim', host: 'fra-01', addr: '51.83.44.10', port: 27035, tv: 27040, state: 'STOPPED' },
  { name: 'main', title: 'eZ-Match · ams-01 main', host: 'ams-01', addr: '89.106.12.7', port: 27015, tv: 27020, state: 'UPDATING' },
  { name: 'main', title: 'eZ-Match · nyc-01 main', host: 'nyc-01', addr: '167.71.4.201', port: 27015, tv: 27020, state: 'ERROR' },
];

const AGENT_TONE = { ONLINE: 'ok', OFFLINE: 'danger', PENDING: 'warn', ERROR: 'danger' };
const INSTANCE_TONE = { RUNNING: 'ok', STARTING: 'info', CREATING: 'info', INSTALLING: 'info', UPDATING: 'info', STOPPING: 'warn', STOPPED: 'neutral', ERROR: 'danger', REMOVED: 'neutral' };

function ServersScreen({ go }) {
  return (
    <div style={{ margin: '0 auto', maxWidth: 'var(--reading-max)', display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-8)' }}>
        <div>
          <h1 style={{ margin: 0, font: 'var(--type-h2)', fontSize: 'var(--text-md)', color: 'var(--text-strong)' }}>Game servers</h1>
          <p style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Hosts running ez-agent, and the CS2 instances they hold.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Button variant="secondary" size="sm">Game servers ({INSTANCES.length})</Button>
          <Button size="sm" onClick={() => go && go('admin-server-new')}>Add agent</Button>
        </div>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div>
          <h2 style={{ margin: 0, font: 'var(--type-h2)', color: 'var(--text-strong)' }}>Agents</h2>
          <p style={{ margin: '2px 0 0', font: 'var(--type-small)', color: 'var(--text-faint)' }}>One ez-agent per host. It installs CS2, starts instances and streams logs back.</p>
        </div>
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: 'var(--border-w) solid var(--border-1)' }}>
              <th style={th}>Host</th><th style={th}>Agent</th><th style={th}>Last seen</th><th style={th}>Free disk</th><th style={th}>Game servers</th><th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>
              {AGENTS.map((a) => (
                <tr key={a.name} style={{ borderTop: 'var(--border-w) solid var(--ink-800)' }}>
                  <td style={td}>
                    <a href="#" style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-strong)' }}>{a.name}</a>
                    <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{a.host} · {a.region}</p>
                    {a.error ? <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--danger-500)' }}>{a.error}</p> : null}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                      <Badge tone={AGENT_TONE[a.status]} live={a.status === 'ONLINE'}>{a.status.toLowerCase()}</Badge>
                      <span className="tabular" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{a.version ? 'v' + a.version : '—'}</span>
                    </div>
                  </td>
                  <td style={{ ...td, color: 'var(--text-body)' }}>{a.seen}</td>
                  <td className="tabular" style={{ ...td, color: 'var(--text-body)' }}>{a.disk}</td>
                  <td style={{ ...td, color: 'var(--text-body)' }}>
                    <span className="tabular">{a.instances}</span>
                    {a.running ? <span style={{ marginLeft: 6, fontSize: 'var(--text-xs)', color: 'var(--ok-500)' }}>{a.running} running</span> : null}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 'var(--space-4)' }}>
                      <Button variant="secondary" size="sm">Open</Button>
                      <Button variant="danger" size="sm">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, font: 'var(--type-h2)', color: 'var(--text-strong)' }}>CS2 instances</h2>
            <p style={{ margin: '2px 0 0', font: 'var(--type-small)', color: 'var(--text-faint)' }}>Each instance is one CS2 process with its own ports and match slot.</p>
          </div>
          <p style={{ margin: 0, font: 'var(--type-small)', color: 'var(--text-faint)' }}>{INSTANCES.length} · 2 running</p>
        </div>
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: 'var(--border-w) solid var(--border-1)' }}>
              <th style={th}>Name</th><th style={th}>Host</th><th style={th}>Port</th><th style={th}>State</th><th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>
              {INSTANCES.map((i, n) => (
                <tr key={n} style={{ borderTop: 'var(--border-w) solid var(--ink-800)' }}>
                  <td style={td}>
                    <a href="#" style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-strong)' }}>{i.name}</a>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{i.title}</p>
                  </td>
                  <td style={td}>
                    <a href="#" style={{ color: 'var(--text-body)' }}>{i.host}</a>
                    <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>{i.addr}</p>
                  </td>
                  <td className="tabular" style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--text-body)' }}>{i.port}<span style={{ color: 'var(--ink-500)' }}> / tv {i.tv}</span></td>
                  <td style={td}><Badge tone={INSTANCE_TONE[i.state]}>{i.state.toLowerCase()}</Badge></td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <Button variant={i.state === 'RUNNING' ? 'primary' : 'secondary'} size="sm">Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
Object.assign(window, { ServersScreen });
