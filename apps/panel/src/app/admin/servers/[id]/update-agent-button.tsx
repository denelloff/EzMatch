'use client';

import { useState } from 'react';
import { secondaryButtonClass } from '@/components/ui';

/**
 * Confirms, starts the update, then does a full page load to `?task=…` so the
 * progress panel and status are immediately visible (soft client navigations
 * often look like “nothing happened”).
 */
export function UpdateAgentButton({
  serverId,
  label,
  disabled = false,
  confirm,
  pendingLabel = 'Updating…',
}: {
  serverId: string;
  label: string;
  disabled?: boolean;
  confirm: string;
  pendingLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className={secondaryButtonClass}
        disabled={disabled || pending}
        onClick={() => {
          if (!window.confirm(confirm)) return;
          setError(null);
          setPending(true);
          void (async () => {
            try {
              const response = await fetch(
                `/admin/servers/${serverId}/update-agent`,
                {
                  method: 'POST',
                  credentials: 'same-origin',
                  headers: { Accept: 'application/json' },
                },
              );
              const body = (await response.json().catch(() => null)) as {
                taskId?: string;
                error?: string;
              } | null;
              if (!response.ok || !body?.taskId) {
                setError(body?.error ?? 'Update failed to start.');
                setPending(false);
                return;
              }
              window.location.assign(
                `/admin/servers/${serverId}?task=${body.taskId}`,
              );
            } catch {
              setError('Update failed to start.');
              setPending(false);
            }
          })();
        }}
      >
        {pending ? pendingLabel : label}
      </button>
      {error ? <p className="text-xs text-danger-500">{error}</p> : null}
    </div>
  );
}
