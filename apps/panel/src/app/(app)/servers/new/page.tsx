import { redirect } from 'next/navigation';

export default function LegacyNewServerRedirect() {
  redirect('/admin/servers/new');
}

