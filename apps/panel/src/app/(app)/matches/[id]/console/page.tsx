import { redirect } from 'next/navigation';

/** Operator tools live under /admin/matches/[id]. */
export default async function LegacyMatchToolRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/matches/${id}/console`);
}
