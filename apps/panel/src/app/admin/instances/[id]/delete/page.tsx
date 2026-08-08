import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { Badge, Card, dangerButtonClass, secondaryButtonClass } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Confirm + submit via a normal HTML form. No client JS required — the panel's
 * CSP historically blocked Next hydration, which made onClick delete dead.
 */
export default async function DeleteInstancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole('ADMIN');
  const t = await getT();
  const { id } = await params;
  const { error } = await searchParams;

  const instance = await prisma.gameInstance.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      state: true,
      gamePort: true,
      tvPort: true,
      server: { select: { id: true, name: true } },
    },
  });
  if (!instance) notFound();

  const backHref = `/admin/servers/${instance.server.id}`;
  const instanceHref = `/admin/instances/${instance.id}`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href={backHref} className="text-xs text-ink-400 hover:text-ink-200">
          ← {instance.server.name}
        </Link>
        <h1
          className="mt-2 text-lg font-semibold text-ink-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t.instanceDeleteTitle}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-400">
          <span>{instance.name}</span>
          <Badge
            tone={
              instance.state === 'RUNNING'
                ? 'ok'
                : instance.state === 'ERROR' || instance.state === 'CREATING'
                  ? 'danger'
                  : 'neutral'
            }
          >
            {instance.state.toLowerCase()}
          </Badge>
          <span>
            · {t.serverPort} {instance.gamePort} · {t.serverTv} {instance.tvPort}
          </span>
        </p>
      </div>

      <Card>
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-ink-300">
            {t.instanceDeleteBody.replace('{name}', instance.name)}
          </p>

          {error ? (
            <p className="rounded-xl border border-danger-500/35 bg-danger-500/10 px-3 py-2 text-xs text-danger-500">
              {error}
            </p>
          ) : null}

          <form
            method="post"
            action={`/admin/instances/${instance.id}/purge`}
            className="flex flex-wrap items-center gap-2"
          >
            <button type="submit" className={dangerButtonClass}>
              {t.instanceDeleteConfirm}
            </button>
            <Link href={instanceHref} className={secondaryButtonClass}>
              {t.instanceDeleteCancel}
            </Link>
          </form>
        </div>
      </Card>
    </div>
  );
}
