'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { COUNTRIES, flagUrl } from '@/lib/countries';
import {
  Card,
  CardHeader,
  Field,
  Notice,
  buttonClass,
  inputClass,
  secondaryButtonClass,
  selectClass,
} from '@/components/ui';
import {
  createTeamAction,
  updateTeamAction,
  type TeamFormState,
} from './actions';

export interface TeamFormDefaults {
  name: string;
  tag: string;
  country: string;
  logoPath: string | null;
}

export function TeamForm({
  mode,
  teamId,
  defaults,
  cancelHref,
  labels,
}: {
  mode: 'create' | 'edit';
  teamId?: string;
  defaults?: TeamFormDefaults;
  cancelHref: string;
  labels: {
    name: string;
    nameHint: string;
    tag: string;
    tagHint: string;
    country: string;
    countryHint: string;
    logo: string;
    logoHint: string;
    clearLogo: string;
    submitCreate: string;
    submitEdit: string;
    cancel: string;
  };
}) {
  const action = mode === 'create' ? createTeamAction : updateTeamAction;
  const [state, formAction] = useActionState<TeamFormState, FormData>(action, {
    error: null,
  });
  const [preview, setPreview] = useState<string | null>(defaults?.logoPath ?? null);
  const [country, setCountry] = useState(defaults?.country ?? 'us');

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      {teamId ? <input type="hidden" name="teamId" value={teamId} /> : null}
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <Card>
        <CardHeader
          title={mode === 'create' ? labels.submitCreate : labels.submitEdit}
          description={labels.nameHint}
        />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label={labels.name}>
            <input
              name="name"
              required
              maxLength={64}
              defaultValue={defaults?.name}
              className={inputClass}
            />
          </Field>

          <Field label={labels.tag} hint={labels.tagHint}>
            <input
              name="tag"
              required
              maxLength={16}
              defaultValue={defaults?.tag}
              className={inputClass}
            />
          </Field>

          <Field label={labels.country} hint={labels.countryHint}>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagUrl(country)}
                alt=""
                width={28}
                height={20}
                className="h-5 w-7 rounded-sm object-cover"
              />
              <select
                name="country"
                required
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className={selectClass}
              >
                {COUNTRIES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.code} — {entry.name}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label={labels.logo} hint={labels.logoHint}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-ink-700 bg-ink-850">
                {preview ? (
                  // Uploaded / stored logos are local or data URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-ink-500">—</span>
                )}
              </div>
              <input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-800 file:px-3 file:py-1.5 file:text-xs file:text-ink-100"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    setPreview(defaults?.logoPath ?? null);
                    return;
                  }
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </div>
            {mode === 'edit' && defaults?.logoPath ? (
              <label className="mt-3 flex items-center gap-2 text-sm text-ink-300">
                <input type="checkbox" name="clearLogo" />
                {labels.clearLogo}
              </label>
            ) : null}
          </Field>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          label={mode === 'create' ? labels.submitCreate : labels.submitEdit}
        />
        <Link href={cancelHref} className={secondaryButtonClass}>
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? '…' : label}
    </button>
  );
}
