'use client';

import { dangerButtonClass } from '@/components/ui';

/**
 * Native form POST to a Route Handler — no React server actions.
 * Survives even when server-action / useActionState wiring misbehaves.
 */
export function ServerListDelete({
  serverId,
  serverName,
}: {
  serverId: string;
  serverName: string;
}) {
  return (
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
  );
}
