'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Card,
  CardHeader,
  Field,
  Notice,
  buttonClass,
  checkboxClass,
  inputClass,
  secondaryButtonClass,
  selectClass,
} from '@/components/ui';
import type { MapOption } from '@/lib/maps';
import { editInstanceAction, type EditInstanceState } from './actions';

const GAME_MODES = [
  { value: 1, label: 'Competitive (5v5)' },
  { value: 2, label: 'Wingman (2v2)' },
  { value: 0, label: 'Casual' },
];

export interface EditDefaults {
  name: string;
  serverTitle: string;
  maxPlayers: number;
  gameMode: number;
  startMap: string;
  vacDisabled: boolean;
  botsDisabled: boolean;
  extraArgs: string;
  hasJoinPassword: boolean;
}

export function EditInstanceForm({
  instanceId,
  defaults,
  maps,
}: {
  instanceId: string;
  defaults: EditDefaults;
  maps: MapOption[];
}) {
  const [state, formAction] = useActionState<EditInstanceState, FormData>(
    editInstanceAction,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="instanceId" value={instanceId} />

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <Card>
        <CardHeader
          title="Server settings"
          description="Saving recreates the container with new environment variables (game files stay on the volume). The server will restart."
        />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label="Instance name" hint="Shown in eZ-Match only.">
            <input
              name="name"
              required
              maxLength={48}
              defaultValue={defaults.name}
              className={inputClass}
            />
          </Field>

          <Field label="Public server name" hint="hostname in the server browser.">
            <input
              name="serverTitle"
              required
              maxLength={64}
              defaultValue={defaults.serverTitle}
              className={inputClass}
            />
          </Field>

          <Field
            label="GSLT token"
            hint="Leave blank to keep the current token. Stored encrypted."
          >
            <input
              name="gsltToken"
              minLength={8}
              maxLength={64}
              autoComplete="off"
              spellCheck={false}
              placeholder="•••••••• (unchanged)"
              className={inputClass}
            />
          </Field>

          <Field
            label="RCON password"
            hint="Leave blank to keep the current password. Also updates Fake RCON if installed."
          >
            <input
              name="rconPassword"
              type="password"
              minLength={8}
              maxLength={64}
              autoComplete="new-password"
              placeholder="•••••••• (unchanged)"
              className={inputClass}
            />
          </Field>

          <Field
            label="Join password"
            hint={
              defaults.hasJoinPassword
                ? 'Leave blank to keep. Check “Remove join password” to make the server public.'
                : 'Optional. Leave empty for a public server.'
            }
          >
            <input
              name="joinPassword"
              type="password"
              maxLength={64}
              autoComplete="new-password"
              placeholder={
                defaults.hasJoinPassword ? '•••••••• (unchanged)' : undefined
              }
              className={inputClass}
            />
          </Field>

          {defaults.hasJoinPassword ? (
            <label className="flex items-start gap-3 sm:col-span-2">
              <input
                type="checkbox"
                name="clearJoinPassword"
                className={clsx('mt-1', checkboxClass)}
              />
              <span>
                <span className="block text-sm text-ink-100">Remove join password</span>
                <span className="mt-0.5 block text-xs text-ink-400">
                  Clears the server password so anyone can connect.
                </span>
              </span>
            </label>
          ) : null}

          <Field label="Game mode">
            <select
              name="gameMode"
              defaultValue={defaults.gameMode}
              className={selectClass}
            >
              {GAME_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Starting map">
            <select
              name="startMap"
              className={selectClass}
              defaultValue={
                maps.some((map) => map.name === defaults.startMap)
                  ? defaults.startMap
                  : maps[0]?.name ?? defaults.startMap
              }
              required
            >
              {!maps.some((map) => map.name === defaults.startMap) &&
              defaults.startMap ? (
                <option value={defaults.startMap}>
                  {defaults.startMap}
                </option>
              ) : null}
              {maps.map((map) => (
                <option key={map.name} value={map.name}>
                  {map.label} ({map.name})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Slots">
            <input
              name="maxPlayers"
              type="number"
              min={2}
              max={64}
              defaultValue={defaults.maxPlayers}
              className={inputClass}
            />
          </Field>

          <Field
            label="Extra launch arguments"
            hint="Optional, e.g. -tickrate 64. No shell syntax."
          >
            <input
              name="extraArgs"
              maxLength={512}
              defaultValue={defaults.extraArgs}
              className={inputClass}
            />
          </Field>

          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              name="botsDisabled"
              defaultChecked={defaults.botsDisabled}
              className={clsx('mt-1', checkboxClass)}
            />
            <span>
              <span className="block text-sm text-ink-100">Disable bots</span>
              <span className="mt-0.5 block text-xs text-ink-400">
                Sets <span className="console-surface">bot_quota 0</span> and kicks bots
                after start. Recommended for match servers.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              name="vacDisabled"
              defaultChecked={defaults.vacDisabled}
              className={clsx('mt-1', checkboxClass)}
            />
            <span>
              <span className="block text-sm text-ink-100">Disable VAC</span>
              <span className="mt-0.5 block text-xs text-ink-400">
                Starts with <span className="console-surface">-insecure</span>.
              </span>
            </span>
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Link
          href={`/admin/instances/${instanceId}`}
          className={secondaryButtonClass}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? 'Saving…' : 'Save and restart'}
    </button>
  );
}
