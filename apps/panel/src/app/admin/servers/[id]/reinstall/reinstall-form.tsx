'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Card,
  CardHeader,
  Field,
  Notice,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/ui';
import {
  reinstallAgentAction,
  type ReinstallAgentState,
} from '../reinstall-actions';

export interface ReinstallAgentLabels {
  button: string;
  title: string;
  description: string;
  connecting: string;
  submit: string;
  cancel: string;
  user: string;
  userHint: string;
  authentication: string;
  authKey: string;
  authPassword: string;
  password: string;
  privateKey: string;
  privateKeyHint: string;
  passphrase: string;
  passphraseHint: string;
  hostKey: string;
  hostKeyHint: string;
}

const initialState: ReinstallAgentState = { error: null };

function Submit({ labels }: { labels: ReinstallAgentLabels }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? labels.connecting : labels.submit}
    </button>
  );
}

export function ReinstallAgentForm({
  serverId,
  backHref,
  labels,
}: {
  serverId: string;
  backHref: string;
  labels: ReinstallAgentLabels;
}) {
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const [state, formAction] = useActionState(reinstallAgentAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="serverId" value={serverId} />
      <input type="hidden" name="authMethod" value={authMethod} />

      <Card>
        <CardHeader title={labels.title} description={labels.description} />
        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.user} hint={labels.userHint}>
              <input
                name="username"
                required
                maxLength={64}
                defaultValue="root"
                className={inputClass}
              />
            </Field>
            <Field label={labels.authentication}>
              <div className="flex gap-2">
                {(
                  [
                    ['password', labels.authPassword],
                    ['key', labels.authKey],
                  ] as const
                ).map(([method, label]) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setAuthMethod(method)}
                    aria-pressed={authMethod === method}
                    className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm transition ${
                      authMethod === method
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {authMethod === 'password' ? (
            <Field label={labels.password}>
              <input
                name="password"
                type="password"
                required
                autoComplete="off"
                className={inputClass}
              />
            </Field>
          ) : (
            <>
              <Field label={labels.privateKey} hint={labels.privateKeyHint}>
                <textarea
                  name="privateKey"
                  rows={6}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                  className={`${inputClass} console-surface resize-y text-xs`}
                />
              </Field>
              <Field label={labels.passphrase} hint={labels.passphraseHint}>
                <input
                  name="passphrase"
                  type="password"
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
            </>
          )}

          <Field label={labels.hostKey} hint={labels.hostKeyHint}>
            <input
              name="expectedHostKey"
              maxLength={256}
              placeholder="SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className={`${inputClass} console-surface text-xs`}
            />
          </Field>
        </div>
      </Card>

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Link href={backHref} className={secondaryButtonClass}>
          {labels.cancel}
        </Link>
        <Submit labels={labels} />
      </div>
    </form>
  );
}
