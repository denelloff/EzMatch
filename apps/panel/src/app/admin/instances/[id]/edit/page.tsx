import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EditInstanceForm } from './edit-form';

export const dynamic = 'force-dynamic';

export default async function EditInstancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!hasRole(user, 'ADMIN')) notFound();

  const { id } = await params;
  const instance = await prisma.gameInstance.findUnique({
    where: { id },
    include: {
      server: { select: { id: true, name: true } },
    },
  });
  if (!instance || instance.state === 'REMOVED') notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/admin/instances/${instance.id}`}
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          ← {instance.name}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">Edit server</h1>
        <p className="mt-1 text-sm text-ink-400">
          {instance.server.name} · changes require a container recreate and restart
        </p>
      </div>

      <EditInstanceForm
        instanceId={instance.id}
        defaults={{
          name: instance.name,
          serverTitle: instance.serverTitle,
          maxPlayers: instance.maxPlayers,
          gameMode: instance.gameMode,
          startMap: instance.startMap,
          vacDisabled: instance.vacDisabled,
          botsDisabled: instance.botsDisabled,
          extraArgs: instance.extraArgs,
          hasJoinPassword: Boolean(instance.joinPasswordEnc),
        }}
      />
    </div>
  );
}
