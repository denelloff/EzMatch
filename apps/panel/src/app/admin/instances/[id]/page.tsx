import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLUGIN_DESCRIPTIONS } from '@ppanel/protocol';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';
import { getT } from '@/lib/i18n';
import { Badge, Card, CardHeader, Notice, buttonClass } from '@/components/ui';
import { EventFeed, type FeedEvent } from '@/components/event-feed';
import { ConsoleView } from './console-view';
import { InstanceControls } from './instance-controls';
import { PluginPanel } from './plugin-panel';

export const dynamic = 'force-dynamic';

const STATE_TONE = {
  RUNNING: 'ok',
  STOPPED: 'neutral',
  ERROR: 'danger',
  REMOVED: 'neutral',
} as const;

export default async function InstancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const t = await getT();
  const { id } = await params;

  const instance = await prisma.gameInstance.findUnique({
    where: { id },
    include: {
      server: { select: { id: true, name: true, publicIp: true, host: true, status: true } },
      plugins: true,
      matches: {
        where: { state: { notIn: ['FINISHED', 'CANCELLED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!instance) notFound();

  const recent = await prisma.gameEvent.findMany({
    where: { instanceId: instance.id },
    orderBy: { ts: 'desc' },
    take: 100,
  });

  const canOperate = hasRole(user, 'OPERATOR');
  const canAdmin = hasRole(user, 'ADMIN');
  const running = instance.state === 'RUNNING';
  const address = `${instance.server.publicIp ?? instance.server.host}:${instance.gamePort}`;

  const initialEvents: FeedEvent[] = recent.map((row) => ({
    ts: row.ts.toISOString(),
    kind: row.kind,
    category: row.category,
    actor: row.actorName ? { name: row.actorName } : null,
    target: row.targetName ? { name: row.targetName } : null,
    data: (row.data ?? {}) as Record<string, unknown>,
  }));

  const staleBuild =
    instance.plugins.some((plugin) => plugin.status === 'INSTALLED') &&
    instance.buildId !== null &&
    instance.buildId !== instance.pluginsOkBuildId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/admin/servers/${instance.server.id}`}
            className="text-xs text-ink-400 hover:text-ink-200"
          >
            ← {instance.server.name}
          </Link>
          <h1 className="mt-2 flex items-center gap-3 text-lg font-semibold text-ink-100">
            {instance.name}
            <Badge tone={STATE_TONE[instance.state as keyof typeof STATE_TONE] ?? 'info'}>
              {instance.state.toLowerCase()}
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            <span className="console-surface">connect {address}</span> · TV{' '}
            {instance.tvPort} · {instance.startMap}
            {instance.buildId ? ` · build ${instance.buildId}` : ''}
            {instance.startedAt ? ` · up since ${formatRelative(instance.startedAt)}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {instance.matches[0] ? (
            <Link
              href={`/matches/${instance.matches[0].id}`}
              className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3.5 py-2 text-sm text-brand-500"
            >
              Match in progress: {instance.matches[0].title}
            </Link>
          ) : null}
          {canAdmin && instance.state !== 'REMOVED' && instance.state !== 'CREATING' ? (
            <Link
              href={`/admin/instances/${instance.id}/edit`}
              className={buttonClass}
            >
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      {instance.lastError ? (
        <Notice tone="danger">{instance.lastError}</Notice>
      ) : null}

      <Card>
        <CardHeader title="Server" description="Container lifecycle and CS2 updates." />
        <div className="px-5 py-4">
          <InstanceControls
            instanceId={instance.id}
            state={instance.state}
            canOperate={canOperate}
            canAdmin={canAdmin}
            updateWarning={
              instance.plugins.some((plugin) => plugin.status === 'INSTALLED')
                ? 'Metamod and CounterStrikeSharp are installed here. They link against the game binaries and regularly stop loading after a CS2 patch, which leaves the server up but without plugins until newer builds are pinned in the catalog. Verify with meta list right after the update.'
                : null
            }
            deleteLabel={t.instanceDelete}
          />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <ConsoleView
            instanceId={instance.id}
            canSend={canOperate}
            running={running}
          />
        </Card>

        <Card>
          <CardHeader
            title="Events"
            description="Parsed from the HTTP log stream, independent of the console."
          />
          <EventFeed instanceId={instance.id} initial={initialEvents} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Plugins"
          description="Pinned versions. Installing one also installs what it depends on."
        />
        <PluginPanel
          instanceId={instance.id}
          catalog={PLUGIN_DESCRIPTIONS}
          installed={instance.plugins.map((plugin) => ({
            pluginId: plugin.pluginId,
            version: plugin.version,
            status: plugin.status,
            lastError: plugin.lastError,
          }))}
          canAdmin={canAdmin}
          staleBuild={staleBuild}
        />
      </Card>
    </div>
  );
}
