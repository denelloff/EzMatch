import { notFound } from 'next/navigation';
import { hasRole, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MatchBackupPanel } from './backup-panel';

export const dynamic = 'force-dynamic';

export default async function AdminMatchBackupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole('OPERATOR');
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: { id: true, state: true, backupPrefix: true },
  });
  if (!match) notFound();

  return (
    <MatchBackupPanel
      matchId={match.id}
      backupPrefix={match.backupPrefix}
      canRestore={hasRole(user, 'ADMIN')}
      state={match.state}
    />
  );
}
