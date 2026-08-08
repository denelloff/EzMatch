'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Field,
  Notice,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/ui';
import {
  addMapAction,
  deleteMapAction,
  toggleMapAction,
  type MapFormState,
} from './actions';

export function AddMapForm({
  labels,
}: {
  labels: {
    name: string;
    nameHint: string;
    label: string;
    labelHint: string;
    submit: string;
  };
}) {
  const [state, formAction] = useActionState<MapFormState, FormData>(addMapAction, {
    error: null,
    ok: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.name} hint={labels.nameHint}>
          <input
            name="name"
            className={inputClass}
            placeholder="de_cache"
            pattern="[a-z0-9_]+"
            maxLength={64}
            required
          />
        </Field>
        <Field label={labels.label} hint={labels.labelHint}>
          <input
            name="label"
            className={inputClass}
            placeholder="Cache"
            maxLength={64}
            required
          />
        </Field>
      </div>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="info">OK</Notice> : null}
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

export function MapRowActions({
  id,
  enabled,
  canDelete,
  labels,
}: {
  id: string;
  enabled: boolean;
  canDelete: boolean;
  labels: {
    enable: string;
    disable: string;
    delete: string;
  };
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={toggleMapAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="enabled" value={enabled ? '0' : '1'} />
        <button type="submit" className={secondaryButtonClass}>
          {enabled ? labels.disable : labels.enable}
        </button>
      </form>
      {canDelete ? (
        <form action={deleteMapAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className={secondaryButtonClass}
            onClick={(event) => {
              if (!window.confirm(labels.delete + '?')) {
                event.preventDefault();
              }
            }}
          >
            {labels.delete}
          </button>
        </form>
      ) : null}
    </div>
  );
}
