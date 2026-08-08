import Link from 'next/link';
import { buttonClass, secondaryButtonClass } from '@/components/ui';

/**
 * Plain link — works even when client JS/hydration is blocked behind a reverse
 * proxy (e.g. pp.denello.ru without allowedDevOrigins).
 */
export function ReinstallAgentButton({
  serverId,
  label,
  emphasize = false,
}: {
  serverId: string;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <Link
      href={`/admin/servers/${serverId}/reinstall`}
      className={emphasize ? buttonClass : secondaryButtonClass}
    >
      {label}
    </Link>
  );
}
