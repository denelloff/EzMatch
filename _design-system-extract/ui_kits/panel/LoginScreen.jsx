const { Logo, Button, Field, Input, Notice, LanguageToggle } = window.EZMatchDesignSystem_ab9a05;

function LoginScreen({ onSignIn }) {
  const [error, setError] = React.useState(false);
  return (
    <main style={{ position: 'relative', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 45% at 50% 20%, var(--brand-glow), transparent 60%)' }} />
      <div className="ezmatch-enter" style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-12)' }}><LanguageToggle locale="en" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 'var(--space-20)' }}>
          <Logo size="lg" href="#" />
          <p style={{ margin: 'var(--space-6) 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Counter-Strike 2 match control</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); const v = e.target.elements.password.value; if (v.length < 3) { setError(true); } else { onSignIn(); } }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', borderRadius: 'var(--radius-xl)', border: 'var(--border-w) solid var(--border-1)', background: 'var(--surface-card)', padding: 'var(--space-12)' }}
        >
          {error ? <Notice tone="danger">Invalid email or password.</Notice> : null}
          <Field label="Email"><Input type="email" name="email" defaultValue="admin@ezmatch.gg" /></Field>
          <Field label="Password"><Input type="password" name="password" placeholder="••••••••" /></Field>
          <Button type="submit" size="lg" block>Sign in</Button>
        </form>
      </div>
    </main>
  );
}
Object.assign(window, { LoginScreen });
