'use client';

import clsx from 'clsx';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Notice, buttonClass, inputClass } from '@/components/ui';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(buttonClass, 'w-full')}
    >
      {pending ? `${label}…` : label}
    </button>
  );
}

export function LoginForm({
  labels,
}: {
  labels: {
    email: string;
    password: string;
    submit: string;
    failed: string;
  };
}) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-ink-700 bg-ink-900 p-6"
    >
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm text-ink-300">
          {labels.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm text-ink-300">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state.error ? <Notice tone="danger">{labels.failed}</Notice> : null}

      <SubmitButton label={labels.submit} />
    </form>
  );
}

