import { redirect } from 'next/navigation';

export default async function LegacyMatchBackupRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/matches/${id}/backup`);
}
