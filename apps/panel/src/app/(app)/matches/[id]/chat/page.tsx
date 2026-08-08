import { redirect } from 'next/navigation';

export default async function LegacyMatchChatRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/matches/${id}/chat`);
}
