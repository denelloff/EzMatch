import { redirect } from 'next/navigation';

/** Old public path — servers live under the admin panel now. */
export default function LegacyServersRedirect() {
  redirect('/admin/servers');
}
