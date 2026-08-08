import { notFound } from 'next/navigation';
import { hasRole, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ConsoleView } from '@/app/admin/instances/[id]/console-view';

export const dynamic = 'force-dynamic';

export default async function AdminMatchConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole('OPERATOR');
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      instance: { select: { id: true, state: true } },
    },
  });
  if (!match) notFound();

  return (
    <div className="h-[min(60vh,36rem)]">
      <ConsoleView
        instanceId={match.instance.id}
        canSend={hasRole(user, 'OPERATOR')}
        running={match.instance.state === 'RUNNING'}
        embedded
      />
    </div>
  );
}
