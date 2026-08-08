import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PLUGIN_DESCRIPTIONS, type HostInfo } from '@ppanel/protocol';
import { assertRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { listEnabledMaps } from '@/lib/maps';
import { InstanceForm } from './instance-form';

export const dynamic = 'force-dynamic';

export default async function NewInstancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertRole('ADMIN');
  const t = await getT();
  const { id } = await params;

  const [server, maps] = await Promise.all([
    prisma.server.findUnique({ where: { id } }),
    listEnabledMaps(),
  ]);
  if (!server) notFound();

  if (server.status !== 'ONLINE') {
    redirect(`/admin/servers/${server.id}`);
  }

  const host = server.hostInfo as HostInfo | null;
  // The agent installs into the Docker data root, which lives under / on every
  // distribution the bootstrap supports.
  const root = host?.disks?.find((disk) => disk.path === '/') ?? host?.disks?.[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/admin/servers/${server.id}`}
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          ← {server.name}
        </Link>
        <h1
          className="mt-2 text-lg font-semibold text-ink-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t.serverInstallCs2}
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          {t.serverInstancesEmptyDescription}
        </p>
      </div>

      <InstanceForm
        serverId={server.id}
        serverName={server.name}
        plugins={PLUGIN_DESCRIPTIONS}
        freeBytes={root?.freeBytes ?? null}
        maps={maps}
      />
    </div>
  );
}
