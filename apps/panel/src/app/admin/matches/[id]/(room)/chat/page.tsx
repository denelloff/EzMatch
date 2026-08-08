import { notFound } from 'next/navigation';
import { hasRole, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MatchChat } from './chat-view';

export const dynamic = 'force-dynamic';

export default async function AdminMatchChatPage({
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
    <MatchChat
      instanceId={match.instance.id}
      canSend={hasRole(user, 'OPERATOR') && match.instance.state === 'RUNNING'}
    />
  );
}
