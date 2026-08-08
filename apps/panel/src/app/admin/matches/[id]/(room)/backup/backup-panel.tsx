'use client';

import clsx from 'clsx';
import { useActionState, useState, useTransition } from 'react';
import {
  Notice,
  buttonClass,
  secondaryButtonClass,
} from '@/components/ui';
import {
  listBackupsAction,
  matchAction,
  type MatchActionState,
} from '@/app/(app)/matches/actions';

export function MatchBackupPanel({
  matchId,
  backupPrefix,
  canRestore,
  state,
}: {
  matchId: string;
  backupPrefix: string;
  canRestore: boolean;
  state: string;
}) {
  const [files, setFiles] = useState<string[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [result, formAction] = useActionState<MatchActionState, FormData>(
    matchAction,
    { error: null, ok: false },
  );

  const blocked = state === 'FINISHED' || state === 'CANCELLED';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-md text-xs text-ink-400">
          Prefix <span className="font-mono text-ink-300">{backupPrefix}</span>.
          Click a round file to restore — sends{' '}
          <span className="font-mono text-ink-300">mp_backup_restore_load_file</span>{' '}
          and pauses.
        </p>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={loading || blocked}
          onClick={() =>
            startLoading(async () => {
              const response = await listBackupsAction(matchId);
              setFiles(response.files);
              setListError(response.error);
            })
          }
        >
          {loading ? 'Reading…' : 'Refresh list'}
        </button>
      </div>

      {listError ? <p className="text-sm text-danger-500">{listError}</p> : null}
      {result.error ? <Notice tone="danger">{result.error}</Notice> : null}
      {result.ok ? <Notice tone="info">Restore requested.</Notice> : null}

      {files === null ? (
        <p className="text-sm text-ink-500">Refresh to load backups from the server.</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-ink-400">
          No backups yet. They appear after the match goes live.
        </p>
      ) : (
        <form action={formAction} className="grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="action" value="restore" />
          {files.map((file) => (
            <button
              key={file}
              type="submit"
              name="file"
              value={file}
              disabled={!canRestore || blocked}
              className={clsx(
                buttonClass,
                'justify-start !bg-ink-850 !text-ink-100 !shadow-none hover:!bg-ink-800',
                (!canRestore || blocked) && 'opacity-50',
              )}
              title={canRestore ? file : 'Admin only'}
            >
              <span className="truncate font-mono text-xs">
                {file.replace(`${backupPrefix}_`, '')}
              </span>
            </button>
          ))}
        </form>
      )}
    </div>
  );
}
