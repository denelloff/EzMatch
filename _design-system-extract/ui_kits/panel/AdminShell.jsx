const { Sidebar, LanguageToggle, Button } = window.EZMatchDesignSystem_ab9a05;

const SECTIONS = [
  { title: 'Main menu', items: [{ href: 'admin', label: 'Home' }, { href: 'admin-stats', label: 'Statistics' }] },
  { title: 'Match menu', items: [{ href: 'admin-live', label: 'Matches in progress', count: 2 }, { href: 'admin-archive', label: 'Archived matches' }, { href: 'admin-seasons', label: 'Seasons overview' }] },
  { title: 'Match management', items: [{ href: 'admin-new', label: 'Create a match' }, { href: 'admin-mine', label: 'My matches', count: 1 }] },
  { title: 'Team management', items: [{ href: 'admin-team-new', label: 'Create team' }, { href: 'admin-teams', label: 'Team management' }] },
  { title: 'Game servers', items: [{ href: 'admin-server-new', label: 'Add agent' }, { href: 'admin-servers', label: 'Game servers' }] },
  { title: 'Settings', items: [{ href: 'admin-settings', label: 'Settings' }, { href: 'admin-users', label: 'Users' }] },
];

function AdminShell({ route, go, title, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar sections={SECTIONS} activeHref={route} onNavigate={go} footerLabel="Credits" copyright="© 2026 eZ-Match" />
      <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column' }}>
        <header style={{ display: 'flex', height: 'var(--header-h)', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'var(--border-w) solid var(--border-1)', background: 'color-mix(in srgb, var(--surface-1) 70%, transparent)', backdropFilter: 'blur(var(--blur-chrome))', padding: '0 var(--pad-page-x)' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-muted)' }}>{title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            <LanguageToggle locale="en" />
            <span style={{ font: 'var(--type-small)', color: 'var(--text-faint)' }}>
              denelloff
              <span style={{ marginLeft: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: 'var(--border-w) solid var(--border-2)', background: 'var(--surface-2)', padding: '1px 6px', fontSize: 'var(--text-3xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-muted)' }}>OWNER</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => go('home')}>Exit admin</Button>
          </div>
        </header>
        <main className="ezmatch-enter" style={{ flex: 1, overflow: 'auto', padding: 'var(--pad-page-y) var(--pad-page-x)' }}>{children}</main>
      </div>
    </div>
  );
}
Object.assign(window, { AdminShell });
