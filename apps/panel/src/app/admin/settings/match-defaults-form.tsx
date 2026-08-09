'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Field,
  Notice,
  buttonClass,
  inputClass,
} from '@/components/ui';
import {
  updateMatchDefaultsAction,
  type MatchDefaultsState,
} from './actions';

export function MatchDefaultsForm({
  freezetime,
  labels,
}: {
  freezetime: number;
  labels: {
    freezetime: string;
    freezetimeHint: string;
    submit: string;
    saved: string;
  };
}) {
  const [state, formAction] = useActionState<MatchDefaultsState, FormData>(
    updateMatchDefaultsAction,
    { error: null, ok: false },
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label={labels.freezetime} hint={labels.freezetimeHint}>
        <input
          name="freezetime"
          type="number"
          min={0}
          max={60}
          step={1}
          defaultValue={freezetime}
          className={`${inputClass} max-w-[8rem]`}
          required
        />
      </Field>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="info">{labels.saved}</Notice> : null}
      <Submit label={labels.submit} />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClass} disabled={pending}>
      {pending ? '…' : label}
    </button>
  );
}
