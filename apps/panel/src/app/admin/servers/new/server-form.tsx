'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Card,
  CardHeader,
  Field,
  Notice,
  buttonClass,
  inputClass,
} from '@/components/ui';
import { addServerAction, type AddServerState } from './actions';

const initialState: AddServerState = { error: null };

export interface ServerFormLabels {
  connecting: string;
  submit: string;
  hostTitle: string;
  hostDescription: string;
  name: string;
  region: string;
  regionHint: string;
  address: string;
  addressHint: string;
  sshPort: string;
  credentialsTitle: string;
  credentialsDescription: string;
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

function Submit({ labels }: { labels: ServerFormLabels }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? labels.connecting : labels.submit}
    </button>
  );
}

export function ServerForm({ labels }: { labels: ServerFormLabels }) {
  const [state, formAction] = useActionState(addServerAction, initialState);
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="authMethod" value={authMethod} />

      <Card>
        <CardHeader title={labels.hostTitle} description={labels.hostDescription} />
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <Field label={labels.name}>
            <input
              name="name"
              required
              maxLength={64}
              placeholder="eu-west-1"
              className={inputClass}
            />
          </Field>
          <Field label={labels.region} hint={labels.regionHint}>
            <input
              name="region"
              maxLength={32}
              placeholder="Frankfurt"
              className={inputClass}
            />
          </Field>
          <Field label={labels.address} hint={labels.addressHint}>
            <input
              name="host"
              required
              maxLength={255}
              placeholder="203.0.113.10"
              className={inputClass}
            />
          </Field>
          <Field label={labels.sshPort}>
            <input
              name="sshPort"
              type="number"
              min={1}
              max={65535}
              defaultValue={22}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={labels.credentialsTitle}
          description={labels.credentialsDescription}
        />
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
              {/*
                Plain buttons, not radios: a controlled radio with sr-only input
                was swallowing clicks on the Password tile in some browsers.
              */}
              <div className="flex gap-2">
                {([
                  ['password', labels.authPassword],
                  ['key', labels.authKey],
                ] as const).map(([method, label]) => (
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

      <div className="flex justify-end">
        <Submit labels={labels} />
      </div>
    </form>
  );
}

