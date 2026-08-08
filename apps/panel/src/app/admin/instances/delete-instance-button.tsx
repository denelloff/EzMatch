import Link from 'next/link';
import { dangerButtonClass } from '@/components/ui';

/**
 * Plain link to the confirm page — works even when client JS/hydration is
 * blocked (strict CSP without inline scripts, reverse-proxy quirks).
 */
export function DeleteInstanceButton({
  instanceId,
  label,
  compact = false,
}: {
  instanceId: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/admin/instances/${instanceId}/delete`}
      className={
        compact
          ? 'rounded-lg border border-danger-500/40 bg-danger-500/10 px-2 py-1 text-[11px] font-semibold text-danger-500 hover:bg-danger-500/18'
          : dangerButtonClass
      }
    >
      {label}
    </Link>
  );
}
