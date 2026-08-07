import Link from 'next/link';
import type { HostInfo } from '@ppanel/protocol';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatBytes, formatRelative } from '@/lib/format';
import { getT } from '@/lib/i18n';
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Notice,
  chipClass,
} from '@/components/ui';
import type { AgentStatus } from '@ppanel/db';
import { ServerListDelete } from './server-list-delete';

export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  ONLINE: 'ok',
  OFFLINE: 'danger',
  PENDING: 'warn',
  ERROR: 'danger',
} as const satisfies Record<AgentStatus, 'ok' | 'danger' | 'warn'>;

/**
 * Server management only. Adding a host is a separate page
 * (`/admin/servers/new`) linked from the sidebar — not from here.
 */
export default async function ServersPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteError?: string }>;
}) {
  await requireRole('ADMIN');
  const t = await getT();
  const { deleteError } = await searchParams;

  const servers = await prisma.server.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { instances: true } },
      instances: {
        select: { id: true, name: true, state: true, gamePort: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">{t.serversTitle}</h1>
        <p className="mt-0.5 text-sm text-ink-400">{t.serversDescription}</p>
      </div>

      {deleteError ? <Notice tone="danger">{deleteError}</Notice> : null}

      {servers.length === 0 ? (
        <Card>
          <EmptyState
            title={t.serversEmptyTitle}
            description={`${t.serversEmptyDescription} ${t.serversEmptyHint}`}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => {
            const host = server.hostInfo as HostInfo | null;
            const largestDisk = host?.disks?.reduce<
              HostInfo['disks'][number] | null
            >(
              (best, disk) =>
                !best || disk.freeBytes > best.freeBytes ? disk : best,
              null,
            );

            return (
              <Card key={server.id}>
                <CardHeader
                  title={
                    <Link
                      href={`/admin/servers/${server.id}`}
                      className="hover:text-brand-500"
                    >
                      {server.name}
                    </Link>
                  }
                  description={`${server.host}:${server.sshPort}${
                    server.region ? ` · ${server.region}` : ''
                  }`}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[server.status]}>
                        {server.status.toLowerCase()}
                      </Badge>
                      <ServerListDelete
                        serverId={server.id}
                        labels={{
                          delete: t.serverDelete,
                          title: t.serverDeleteTitle,
                          body: t.serverDeleteBody.replace(
                            '{name}',
                            server.name,
                          ),
                          confirm: t.serverDeleteConfirm,
                          cancel: t.serverDeleteCancel,
                          failed: t.serverDeleteFailed,
                        }}
                      />
                    </div>
                  }
                />
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-ink-400">{t.lastSeen}</dt>
                    <dd className="text-ink-200">
                      {formatRelative(server.lastSeenAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">{t.agent}</dt>
                    <dd className="text-ink-200">
                      {server.agentVersion ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">{t.freeDisk}</dt>
                    <dd className="text-ink-200">
                      {formatBytes(largestDisk?.freeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-400">{t.instances}</dt>
                    <dd className="text-ink-200">{server._count.instances}</dd>
                  </div>
                </dl>

                {server.instances.length > 0 ? (
                  <div className="flex flex-wrap gap-2 border-t border-ink-700 px-5 py-3">
                    {server.instances.map((instance) => (
                      <Link
                        key={instance.id}
                        href={`/admin/instances/${instance.id}`}
                        className={chipClass}
                      >
                        {instance.name}
                        <span className="ml-2 text-ink-400">
                          :{instance.gamePort} · {instance.state.toLowerCase()}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {server.lastError ? (
                  <p className="border-t border-ink-700 px-5 py-3 text-xs text-danger-500">
                    {server.lastError}
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
