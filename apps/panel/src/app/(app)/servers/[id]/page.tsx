import { redirect } from 'next/navigation';

export default async function LegacyServerRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/servers/${id}`);
}

