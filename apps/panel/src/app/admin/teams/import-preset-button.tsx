'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Notice, secondaryButtonClass } from '@/components/ui';
import {
  importProTeamsAction,
  type ImportPresetState,
} from './actions';

export function ImportProTeamsButton({
  label,
  hint,
  resultLabel,
}: {
  label: string;
  hint: string;
  resultLabel: string;
}) {
  const [state, formAction] = useActionState<ImportPresetState, FormData>(
    importProTeamsAction,
    { error: null, imported: 0, skipped: 0 },
  );

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Submit label={label} />
      </form>
      <p className="text-xs text-ink-400">{hint}</p>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {!state.error && (state.imported > 0 || state.skipped > 0) ? (
        <Notice tone="info">
          {resultLabel
            .replace('{imported}', String(state.imported))
            .replace('{skipped}', String(state.skipped))}
        </Notice>
      ) : null}
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={secondaryButtonClass}>
      {pending ? '…' : label}
    </button>
  );
}
