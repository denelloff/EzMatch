import { redirect } from 'next/navigation';

export default async function LegacyNewMatchRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/instances/${id}/matches/new`);
}

