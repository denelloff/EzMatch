'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { syncDemosAction } from '@/app/(app)/matches/actions';
import { Notice, secondaryButtonClass } from '@/components/ui';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={secondaryButtonClass} disabled={pending}>
      {pending ? 'Reading the volume…' : 'Re-index demos'}
    </button>
  );
}

export function SyncDemosButton({ matchId }: { matchId: string }) {
  const [state, formAction] = useActionState(syncDemosAction, {
    error: null,
    indexed: null,
  });

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex items-center gap-3">
        <input type="hidden" name="matchId" value={matchId} />
        <Submit />
        {state.indexed !== null ? (
          <span className="text-sm text-ink-400">
            {state.indexed === 0
              ? 'No recording found for this match.'
              : `${state.indexed} file${state.indexed === 1 ? '' : 's'} indexed.`}
          </span>
        ) : null}
      </form>

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
    </div>
  );
}
