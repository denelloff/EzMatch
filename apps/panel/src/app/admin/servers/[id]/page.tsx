import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { HostInfo } from '@ppanel/protocol';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatBytes, formatRelative } from '@/lib/format';
import { getT } from '@/lib/i18n';
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Notice,
  buttonClass,
} from '@/components/ui';
import { DeployAgentPanel } from '@/components/deploy-agent-panel';
import { NetworkLoadChart } from '@/components/network-load-chart';
import { ServerActions } from './server-actions';

export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  ONLINE: 'ok',
  OFFLINE: 'danger',
  PENDING: 'warn',
  ERROR: 'danger',
} as const;

export default async function ServerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string; deleteError?: string }>;
}) {
  const user = await requireUser();
  const t = await getT();
  const { id } = await params;
  const { task, deleteError } = await searchParams;

  const server = await prisma.server.findUnique({
    where: { id },
    include: {
      instances: { orderBy: { createdAt: 'asc' } },
      agentToken: { select: { tokenPrefix: true, lastUsedAt: true, revokedAt: true } },
      tasks: { orderBy: { createdAt: 'desc' }, take: 8 },
    },
  });
  if (!server) notFound();

  const canManage = hasRole(user, 'ADMIN');
  const host = server.hostInfo as HostInfo | null;
  const agentOnline = server.status === 'ONLINE';
  const canInstallCs2 = canManage && agentOnline && !task;

  const statusLabel = {
    ONLINE: t.serverStatusOnline,
    OFFLINE: t.serverStatusOffline,
    PENDING: t.serverStatusPending,
    ERROR: t.serverStatusError,
  }[server.status];

  const taskStatusLabel = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return t.serverTaskSucceeded;
      case 'FAILED':
        return t.serverTaskFailed;
      case 'TIMED_OUT':
        return t.serverTaskTimedOut;
      case 'RUNNING':
        return t.serverTaskRunning;
      case 'QUEUED':
        return t.serverTaskQueued;
      default:
        return status.toLowerCase();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/servers"
            className="text-xs text-ink-400 hover:text-ink-200"
          >
            {t.serverBack}
          </Link>
          <h1
            className="mt-2 flex items-center gap-3 text-lg font-semibold text-ink-100"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {server.name}
            <Badge tone={STATUS_TONE[server.status]}>{statusLabel}</Badge>
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {server.host}:{server.sshPort}
            {server.region ? ` · ${server.region}` : ''} · {t.serverAgentLabel}{' '}
            {server.agentVersion ?? t.serverAgentUnknown} · {t.serverLastSeen}{' '}
            {formatRelative(server.lastSeenAt)}
          </p>
        </div>

        {canManage ? (
          <div className="flex gap-2">
            {canInstallCs2 ? (
              <Link
                href={`/admin/servers/${server.id}/instances/new`}
                className={buttonClass}
              >
                {t.serverInstallCs2}
              </Link>
            ) : null}
            <ServerActions
              serverId={server.id}
              serverName={server.name}
              deleteError={deleteError ?? null}
            />
          </div>
        ) : null}
      </div>

      {server.lastError ? (
        <Notice tone="danger">{server.lastError}</Notice>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t.serverInstancesTitle}
            description={t.serverInstancesDescription}
          />
          {server.instances.length === 0 ? (
            <EmptyState
              title={
                agentOnline
                  ? t.serverInstancesEmptyTitle
                  : t.serverAgentWaitTitle
              }
              description={
                task
                  ? t.serverAgentWaitDeploying
                  : agentOnline
                    ? t.serverInstancesEmptyDescription
                    : t.serverAgentWaitDescription
              }
              action={
                canInstallCs2 ? (
                  <Link
                    href={`/admin/servers/${server.id}/instances/new`}
                    className={buttonClass}
                  >
                    {t.serverInstallCs2}
                  </Link>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-ink-700/80">
              {server.instances.map((instance) => (
                <li key={instance.id}>
                  <Link
                    href={`/admin/instances/${instance.id}`}
                    className="flex items-center justify-between px-5 py-3 transition hover:bg-ink-850"
                  >
                    <div>
                      <p className="text-sm text-ink-100">{instance.name}</p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {t.serverPort} {instance.gamePort} · {t.serverTv}{' '}
                        {instance.tvPort}
                        {instance.buildId
                          ? ` · ${t.serverBuild} ${instance.buildId}`
                          : ''}
                      </p>
                    </div>
                    <Badge
                      tone={
                        instance.state === 'RUNNING'
                          ? 'ok'
                          : instance.state === 'ERROR'
                            ? 'danger'
                            : 'neutral'
                      }
                    >
                      {instance.state.toLowerCase()}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t.serverHostTitle} />
          <dl className="space-y-3 px-5 py-4 text-sm">
            <Row label={t.serverOs} value={host?.os ?? '—'} />
            <Row label={t.serverKernel} value={host?.kernel ?? '—'} />
            <Row label={t.serverArch} value={host?.arch ?? '—'} />
            <Row label={t.serverCpus} value={host?.cpuCount?.toString() ?? '—'} />
            <Row label={t.serverMemory} value={formatBytes(host?.totalMemBytes)} />
            <Row
              label={t.serverFreeDisk}
              value={
                host?.disks?.length
                  ? host.disks
                      .map((disk) =>
                        t.serverFreeDiskFree
                          .replace('{free}', formatBytes(disk.freeBytes))
                          .replace('{path}', disk.path),
                      )
                      .join(' · ')
                  : '—'
              }
            />
            <Row label={t.serverDocker} value={host?.dockerVersion ?? '—'} />
            <Row
              label={t.serverAgentToken}
              value={
                server.agentToken
                  ? server.agentToken.revokedAt
                    ? t.serverTokenRevoked
                    : t.serverTokenUsed
                        .replace('{prefix}', server.agentToken.tokenPrefix)
                        .replace(
                          '{when}',
                          formatRelative(server.agentToken.lastUsedAt),
                        )
                  : t.serverTokenMissing
              }
            />
          </dl>

          {host?.disks?.length ? (
            <div className="border-t border-ink-700/80 px-5 py-4">
              <p className="text-xs text-ink-400">{t.serverDisks}</p>
              <ul className="mt-2 space-y-2">
                {host.disks.map((disk) => (
                  <li key={disk.path} className="text-sm">
                    <div className="flex justify-between text-ink-200">
                      <span className="console-surface text-xs">{disk.path}</span>
                      <span className="text-xs">
                        {t.serverDiskFreeTotal
                          .replace('{free}', formatBytes(disk.freeBytes))
                          .replace('{total}', formatBytes(disk.totalBytes))}
                      </span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((disk.totalBytes - disk.freeBytes) /
                                Math.max(disk.totalBytes, 1)) *
                                100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <NetworkLoadChart
            history={host?.networkHistory}
            rxBytesPerSec={host?.networkRxBytesPerSec}
            txBytesPerSec={host?.networkTxBytesPerSec}
            title={t.serverNetwork}
            waiting={t.serverNetworkWaiting}
          />
        </Card>
      </div>

      {server.tasks.length > 0 || task ? (
        <Card>
          <CardHeader title={t.serverRecentTasks} />
          {server.tasks.length > 0 ? (
            <ul className="divide-y divide-ink-700/80">
              {server.tasks.map((entry) => (
                <li
                  key={entry.id}
                  className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${
                    task === entry.id ? 'bg-ink-850' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-ink-200">{entry.type}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      {entry.error ?? entry.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-ink-400">
                      {formatRelative(entry.createdAt)}
                    </span>
                    <Badge
                      tone={
                        entry.status === 'SUCCEEDED'
                          ? 'ok'
                          : entry.status === 'FAILED' ||
                              entry.status === 'TIMED_OUT'
                            ? 'danger'
                            : 'info'
                      }
                    >
                      {taskStatusLabel(entry.status)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-400">
              {t.serverDeployStarted}
            </p>
          )}
        </Card>
      ) : null}

      {task ? (
        <DeployAgentPanel
          taskId={task}
          labels={{
            title: t.serverDeployTitle,
            waiting: t.serverDeployWaiting,
            consoleTitle: t.serverLiveConsole,
            consoleHint: t.serverLiveConsoleHint,
            live: t.serverLiveConnected,
            ended: t.serverLiveEnded,
            phaseQueued: t.serverPhaseQueued,
            phasePreflight: t.serverPhasePreflight,
            phaseDocker: t.serverPhaseDocker,
            phaseDisk: t.serverPhaseDisk,
            phaseNetwork: t.serverPhaseNetwork,
            phaseCredentials: t.serverPhaseCredentials,
            phaseAgent: t.serverPhaseAgent,
            phaseDone: t.serverPhaseDone,
            taskSucceeded: t.serverTaskSucceeded,
            taskFailed: t.serverTaskFailed,
            taskTimedOut: t.serverTaskTimedOut,
            taskRunning: t.serverTaskRunning,
            taskQueued: t.serverTaskQueued,
          }}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="truncate text-right text-ink-200">{value}</dd>
    </div>
  );
}
