import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasRole, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { Badge, Notice, buttonClass } from '@/components/ui';
import { InstanceControls } from '@/app/admin/instances/[id]/instance-controls';

export const dynamic = 'force-dynamic';

const STATE_TONE = {
  RUNNING: 'ok',
  STOPPED: 'neutral',
  ERROR: 'danger',
  REMOVED: 'neutral',
  CREATING: 'info',
  INSTALLING: 'info',
  STARTING: 'info',
  STOPPING: 'warn',
  UPDATING: 'warn',
} as const;

export default async function AdminMatchServerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole('OPERATOR');
  const t = await getT();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      instance: {
        select: {
          id: true,
          name: true,
          state: true,
          lastError: true,
          gamePort: true,
          tvPort: true,
          startMap: true,
          buildId: true,
          server: {
            select: {
              id: true,
              name: true,
              publicIp: true,
              host: true,
              status: true,
            },
          },
          plugins: { select: { status: true } },
        },
      },
    },
  });
  if (!match) notFound();

  const instance = match.instance;
  const canOperate = hasRole(user, 'OPERATOR');
  const canAdmin = hasRole(user, 'ADMIN');
  const address = `${instance.server.publicIp ?? instance.server.host}:${instance.gamePort}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-ink-100">{instance.name}</h2>
            <Badge
              tone={
                STATE_TONE[instance.state as keyof typeof STATE_TONE] ?? 'info'
              }
            >
              {instance.state.toLowerCase()}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-400">
            {instance.server.name} ·{' '}
            <span className="console-surface">connect {address}</span> · TV{' '}
            {instance.tvPort} · {instance.startMap}
            {instance.buildId ? ` · build ${instance.buildId}` : ''}
          </p>
        </div>
        <Link
          href={`/admin/instances/${instance.id}`}
          className={buttonClass}
        >
          {t.matchTabServerFull}
        </Link>
      </div>

      {instance.lastError ? (
        <Notice tone="danger">{instance.lastError}</Notice>
      ) : null}

      <InstanceControls
        instanceId={instance.id}
        state={instance.state}
        canOperate={canOperate}
        canAdmin={canAdmin}
        updateWarning={
          instance.plugins.some((plugin) => plugin.status === 'INSTALLED')
            ? 'Metamod / CounterStrikeSharp may need a rebuild after a CS2 update.'
            : null
        }
        deleteLabel={t.instanceDelete}
      />
    </div>
  );
}
