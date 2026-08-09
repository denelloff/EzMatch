import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getT } from '@/lib/i18n';
import { ServerForm } from './server-form';

export const dynamic = 'force-dynamic';

export default async function NewServerPage() {
  await requireRole('ADMIN');
  const t = await getT();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/servers"
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          {t.addServerBack}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">
          {t.addServerTitle}
        </h1>
        <p className="mt-1 text-sm text-ink-400">{t.addServerDescription}</p>
      </div>

      <ServerForm
        labels={{
          connecting: t.addServerConnecting,
          submit: t.addServerSubmit,
          hostTitle: t.addServerHostTitle,
          hostDescription: t.addServerHostDescription,
          name: t.addServerName,
          region: t.addServerRegion,
          regionHint: t.addServerRegionHint,
          address: t.addServerAddress,
          addressHint: t.addServerAddressHint,
          sshPort: t.addServerSshPort,
          credentialsTitle: t.addServerCredTitle,
          credentialsDescription: t.addServerCredDescription,
          user: t.addServerUser,
          userHint: t.addServerUserHint,
          authentication: t.addServerAuth,
          authKey: t.addServerAuthKey,
          authPassword: t.addServerAuthPassword,
          password: t.addServerPassword,
          privateKey: t.addServerPrivateKey,
          privateKeyHint: t.addServerPrivateKeyHint,
          passphrase: t.addServerPassphrase,
          passphraseHint: t.addServerPassphraseHint,
          hostKey: t.addServerHostKey,
          hostKeyHint: t.addServerHostKeyHint,
        }}
      />

      <div className="rounded-lg border border-ink-700 bg-ink-900 px-5 py-4 text-sm text-ink-400">
        <p className="font-medium text-ink-200">{t.addServerBefore}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.addServerReqOs}</li>
          <li>{t.addServerReqDisk}</li>
          <li>{t.addServerReqDocker}</li>
          <li>{t.addServerStepAgent}</li>
        </ul>
      </div>
    </div>
  );
}

