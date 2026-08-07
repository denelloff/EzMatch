import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getLocale, getT } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import { PMatchLogo } from '@/components/pmatch-logo';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/');

  const t = await getT();
  const locale = await getLocale();

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 20%, rgba(110,168,216,0.14), transparent 60%)',
        }}
      />
      <div className="pmatch-enter relative w-full max-w-sm">
        <div className="mb-6 flex justify-end">
          <LanguageToggle
            locale={locale}
            labels={{ en: t.langEn, ru: t.langRu }}
            returnTo="/login"
          />
        </div>
        <div className="mb-8 flex flex-col items-center text-center">
          <PMatchLogo href="/login" size="lg" />
          <p className="mt-3 text-sm text-ink-400">{t.brandTagline}</p>
        </div>
        <LoginForm
          labels={{
            email: t.loginEmail,
            password: t.loginPassword,
            submit: t.loginSubmit,
            failed: t.loginFailed,
          }}
        />
      </div>
    </main>
  );
}
