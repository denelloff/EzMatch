import { secondaryButtonClass } from '@/components/ui';

/**
 * Plain form POST — works without client JS. Requires an online agent that
 * already supports `agent.update` (reinstall once after that feature ships).
 */
export function UpdateAgentButton({
  serverId,
  label,
  disabled = false,
  confirm,
}: {
  serverId: string;
  label: string;
  disabled?: boolean;
  confirm: string;
}) {
  return (
    <form
      method="post"
      action={`/admin/servers/${serverId}/update-agent`}
      onSubmit={(event) => {
        if (!window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className={secondaryButtonClass} disabled={disabled}>
        {label}
      </button>
    </form>
  );
}
