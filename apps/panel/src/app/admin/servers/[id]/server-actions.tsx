'use client';

import { dangerButtonClass, secondaryButtonClass } from '@/components/ui';

export function ServerActions({
  serverId,
  serverName,
  deleteError,
}: {
  serverId: string;
  serverName: string;
  deleteError?: string | null;
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <form
          method="post"
          action={`/admin/servers/${serverId}/revoke`}
          onSubmit={(event) => {
            if (
              !window.confirm(
                'Revoking the token disconnects the agent immediately. The server has to be bootstrapped again over SSH. Continue?',
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <button type="submit" className={secondaryButtonClass}>
            Revoke token
          </button>
        </form>

        <form
          method="post"
          action={`/admin/servers/${serverId}/delete`}
          onSubmit={(event) => {
            if (
              !window.confirm(
                `Delete server “${serverName}” from the panel? This cannot be undone.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <button type="submit" className={dangerButtonClass}>
            Delete
          </button>
        </form>
      </div>

      {deleteError ? (
        <p className="max-w-sm text-right text-xs text-danger-500">{deleteError}</p>
      ) : null}
    </div>
  );
}
