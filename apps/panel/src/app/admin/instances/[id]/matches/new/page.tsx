import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assertRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MatchForm } from './match-form';

export const dynamic = 'force-dynamic';

export default async function NewMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertRole('OPERATOR');
  const { id } = await params;

  const instance = await prisma.gameInstance.findUnique({
    where: { id },
    select: { id: true, name: true, startMap: true, state: true },
  });
  if (!instance) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/instances/${instance.id}`}
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          ← {instance.name}
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-ink-100">Start a match</h1>
        <p className="mt-1 text-sm text-ink-400">
          PMatch drives the match with stock convars over the console. No server
          plugin is required, and none is used.
        </p>
      </div>

      <MatchForm instanceId={instance.id} defaultMap={instance.startMap} />
    </div>
  );
}
