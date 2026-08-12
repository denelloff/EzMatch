const { TopNav, LanguageToggle, Button } = window.EZMatchDesignSystem_ab9a05;

function AppShell({ route, go, children }) {
  return (
    <div style={{ minHeight: '100%' }}>
      <TopNav
        activeHref={route}
        onNavigate={go}
        user="denelloff"
        role="OWNER"
        items={[
          { href: 'home', label: 'Matches in progress', count: 2 },
          { href: 'archive', label: 'Archived matches' },
          { href: 'stats', label: 'Statistics' },
        ]}
        right={<>
          <LanguageToggle locale="en" />
          <button type="button" style={{ border: 0, background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius-lg)', padding: '6px 10px', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>Sign out</button>
          <Button variant="secondary" size="sm" onClick={() => go('admin')}>Admin panel</Button>
        </>}
      />
      <main className="ezmatch-enter" style={{ margin: '0 auto', maxWidth: 'var(--content-max)', padding: 'var(--space-20) var(--space-8)' }}>{children}</main>
    </div>
  );
}
Object.assign(window, { AppShell });
