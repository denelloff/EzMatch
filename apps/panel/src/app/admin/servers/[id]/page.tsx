import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { HostInfo } from '@ppanel/protocol';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';
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
import { DeleteInstanceButton } from '@/app/admin/instances/delete-instance-button';
import { LiveHostPanel } from './live-host-panel';
import { ReinstallAgentButton } from './reinstall-agent';
import { UpdateAgentButton } from './update-agent-button';
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
  const hubPublicUrl = process.env.HUB_PUBLIC_URL ?? 'ws://…';

  const urlTask = task
    ? server.tasks.find((entry) => entry.id === task) ?? null
    : null;
  const runningTask =
    server.tasks.find(
      (entry) => entry.status === 'QUEUED' || entry.status === 'RUNNING',
    ) ?? null;
  // Only stream an in-flight job. A finished ?task= left in the URL must not
  // block CS2 install or show a stuck "queued" console when SSE is blocked.
  const liveTask =
    (urlTask &&
    (urlTask.status === 'QUEUED' || urlTask.status === 'RUNNING')
      ? urlTask
      : null) ?? runningTask;
  const liveTaskId = liveTask?.id ?? null;
  const deploying = liveTaskId != null;
  const canInstallCs2 = canManage && agentOnline && !deploying;

  const displayStatus = deploying ? 'PENDING' : server.status;
  const showLastError =
    !!server.lastError && server.status === 'ERROR' && !deploying;
  const waitingForAgent =
    !agentOnline && (displayStatus === 'PENDING' || deploying);

  const statusLabel = {
    ONLINE: t.serverStatusOnline,
    OFFLINE: t.serverStatusOffline,
    PENDING: t.serverStatusPending,
    ERROR: t.serverStatusError,
  }[displayStatus];

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
            <Badge tone={STATUS_TONE[displayStatus]}>{statusLabel}</Badge>
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {server.host}:{server.sshPort}
            {server.region ? ` · ${server.region}` : ''} · {t.serverAgentLabel}{' '}
            {server.agentVersion ?? t.serverAgentUnknown} · {t.serverLastSeen}{' '}
            {formatRelative(server.lastSeenAt)}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap justify-end gap-2">
            {canInstallCs2 ? (
              <Link
                href={`/admin/servers/${server.id}/instances/new`}
                className={buttonClass}
              >
                {t.serverInstallCs2}
              </Link>
            ) : null}
            {agentOnline ? (
              <UpdateAgentButton
                serverId={server.id}
                label={t.serverUpdateAgent}
                confirm={t.serverUpdateAgentConfirm}
                disabled={deploying}
              />
            ) : null}
            <ReinstallAgentButton
              serverId={server.id}
              label={t.serverReinstall}
              emphasize={showLastError}
            />
            <ServerActions
              serverId={server.id}
              deleteError={deleteError ?? null}
              revokeLabel={t.serverRevokeToken}
              revokeConfirm={t.serverRevokeConfirm}
              deleteLabels={{
                delete: t.serverDelete,
                title: t.serverDeleteTitle,
                body: t.serverDeleteBody.replace('{name}', server.name),
                confirm: t.serverDeleteConfirm,
                cancel: t.serverDeleteCancel,
                failed: t.serverDeleteFailed,
              }}
            />
          </div>
        ) : null}
      </div>

      {showLastError ? (
        <Notice tone="danger">{server.lastError}</Notice>
      ) : null}

      {waitingForAgent && !showLastError ? (
        <Notice tone="warn">
          {t.serverAgentHubHint.replace('{url}', hubPublicUrl)}
        </Notice>
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
                deploying
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
                <li
                  key={instance.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <Link
                    href={`/admin/instances/${instance.id}`}
                    className="min-w-0 flex-1 transition hover:opacity-90"
                  >
                    <p className="text-sm text-ink-100">{instance.name}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {t.serverPort} {instance.gamePort} · {t.serverTv}{' '}
                      {instance.tvPort}
                      {instance.buildId
                        ? ` · ${t.serverBuild} ${instance.buildId}`
                        : ''}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      tone={
                        instance.state === 'RUNNING'
                          ? 'ok'
                          : instance.state === 'ERROR' ||
                              instance.state === 'CREATING'
                            ? 'danger'
                            : 'neutral'
                      }
                    >
                      {instance.state.toLowerCase()}
                    </Badge>
                    {canManage ? (
                      <DeleteInstanceButton
                        instanceId={instance.id}
                        compact
                        label={t.instanceDelete}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <LiveHostPanel
          serverId={server.id}
          initialHost={host}
          agentTokenValue={
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
          labels={{
            title: t.serverHostTitle,
            os: t.serverOs,
            kernel: t.serverKernel,
            arch: t.serverArch,
            cpus: t.serverCpus,
            memory: t.serverMemory,
            freeDisk: t.serverFreeDisk,
            freeDiskFree: t.serverFreeDiskFree,
            docker: t.serverDocker,
            agentToken: t.serverAgentToken,
            disks: t.serverDisks,
            diskFreeTotal: t.serverDiskFreeTotal,
            network: t.serverNetwork,
            networkWaiting: t.serverNetworkWaiting,
            live: t.serverLiveConnected,
          }}
        />
      </div>

      {server.tasks.length > 0 || liveTaskId ? (
        <Card>
          <CardHeader title={t.serverRecentTasks} />
          {server.tasks.length > 0 ? (
            <ul className="divide-y divide-ink-700/80">
              {server.tasks.map((entry) => (
                <li
                  key={entry.id}
                  className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${
                    liveTaskId === entry.id ? 'bg-ink-850' : ''
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

      {liveTaskId && liveTask ? (
        <DeployAgentPanel
          taskId={liveTaskId}
          initial={{
            status: liveTask.status,
            phase: liveTask.phase,
            percent: liveTask.percent,
            message: liveTask.message,
            error: liveTask.error,
          }}
          labels={{
            title:
              liveTask.type === 'server.agentUpdate'
                ? t.serverUpdateAgentTitle
                : liveTask.type.startsWith('instance.')
                  ? t.serverDeployTitleServer
                  : t.serverDeployTitle,
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
            progressPercent: t.serverProgressPercent,
            progressEta: t.serverProgressEta,
            progressEtaWait: t.serverProgressEtaWait,
          }}
        />
      ) : null}
    </div>
  );
}
