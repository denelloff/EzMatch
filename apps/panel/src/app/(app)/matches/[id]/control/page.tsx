import { redirect } from 'next/navigation';

export default async function LegacyMatchControlRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/matches/${id}/control`);
}
