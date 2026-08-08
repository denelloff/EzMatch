import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { Badge } from '@/components/ui';
import { ReinstallAgentForm } from './reinstall-form';

export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  ONLINE: 'ok',
  OFFLINE: 'danger',
  PENDING: 'warn',
  ERROR: 'danger',
} as const;

export default async function ReinstallAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('ADMIN');
  const t = await getT();
  const { id } = await params;

  const server = await prisma.server.findUnique({
    where: { id },
    select: { id: true, name: true, host: true, sshPort: true, status: true },
  });
  if (!server) notFound();

  const statusLabel = {
    ONLINE: t.serverStatusOnline,
    OFFLINE: t.serverStatusOffline,
    PENDING: t.serverStatusPending,
    ERROR: t.serverStatusError,
  }[server.status];

  const backHref = `/admin/servers/${server.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={backHref}
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          {t.serverBack}
        </Link>
        <h1
          className="mt-2 flex flex-wrap items-center gap-3 text-lg font-semibold text-ink-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t.serverReinstallTitle}
          <Badge tone={STATUS_TONE[server.status]}>{statusLabel}</Badge>
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          {server.name} · {server.host}:{server.sshPort}
        </p>
      </div>

      <ReinstallAgentForm
        serverId={server.id}
        backHref={backHref}
        labels={{
          button: t.serverReinstall,
          title: t.serverReinstallTitle,
          description: t.serverReinstallDescription,
          connecting: t.serverReinstallConnecting,
          submit: t.serverReinstallSubmit,
          cancel: t.serverReinstallCancel,
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
    </div>
  );
}
