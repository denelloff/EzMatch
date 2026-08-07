'use client';

import { secondaryButtonClass } from '@/components/ui';
import {
  DeleteServerButton,
  type DeleteServerLabels,
} from '../delete-server-button';

export function ServerActions({
  serverId,
  deleteError,
  deleteLabels,
  revokeLabel,
  revokeConfirm,
}: {
  serverId: string;
  deleteError?: string | null;
  deleteLabels: DeleteServerLabels;
  revokeLabel: string;
  revokeConfirm: string;
}) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <form
          method="post"
          action={`/admin/servers/${serverId}/revoke`}
          onSubmit={(event) => {
            if (!window.confirm(revokeConfirm)) {
              event.preventDefault();
            }
          }}
        >
          <button type="submit" className={secondaryButtonClass}>
            {revokeLabel}
          </button>
        </form>

        <DeleteServerButton serverId={serverId} labels={deleteLabels} />
      </div>

      {deleteError ? (
        <p className="max-w-sm text-right text-xs text-danger-500">{deleteError}</p>
      ) : null}
    </div>
  );
}
