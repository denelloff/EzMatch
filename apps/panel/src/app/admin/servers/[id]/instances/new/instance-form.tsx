'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { PluginCatalogEntry } from '@ppanel/protocol';
import type { MapOption } from '@/lib/maps';
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
import { createInstanceAction, type NewInstanceState } from './actions';

const GAME_MODES = [
  { value: 1, label: 'Competitive (5v5)' },
  { value: 2, label: 'Wingman (2v2)' },
  { value: 0, label: 'Casual' },
];

export function InstanceForm({
  serverId,
  serverName,
  plugins,
  freeBytes,
  maps,
}: {
  serverId: string;
  serverName: string;
  plugins: PluginCatalogEntry[];
  freeBytes: number | null;
  maps: MapOption[];
}) {
  const [state, formAction] = useActionState<NewInstanceState, FormData>(
    createInstanceAction,
    { error: null },
  );
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (entry: PluginCatalogEntry) => {
    setSelected((current) => {
      if (current.includes(entry.id)) {
        // Dropping a plugin drops whatever only existed to support it.
        return current.filter(
          (id) => id !== entry.id && !plugins.find((p) => p.id === id)?.requires.includes(entry.id),
        );
      }
      return [...new Set([...current, ...entry.requires, entry.id])];
    });
  };

  const tight = freeBytes !== null && freeBytes < 92_274_688_000;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="serverId" value={serverId} />

      <Card>
        <CardHeader
          title="Server settings"
          description={`Installs into a new Docker container on ${serverName}.`}
        />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label="Instance name" hint="Shown in eZ-Match only.">
            <input
              name="name"
              required
              maxLength={48}
              defaultValue="CS2"
              className={inputClass}
            />
          </Field>

          <Field label="Public server name" hint="hostname in the server browser.">
            <input
              name="serverTitle"
              required
              maxLength={64}
              defaultValue="eZ-Match CS2"
              className={inputClass}
            />
          </Field>

          <Field
            label="GSLT token"
            hint={
              <>
                One token per running server, from{' '}
                <a
                  className="text-brand-500 hover:underline"
                  href="https://steamcommunity.com/dev/managegameservers"
                  target="_blank"
                  rel="noreferrer"
                >
                  Steam Game Server accounts
                </a>{' '}
                (app 730). Stored encrypted.
              </>
            }
          >
            <input
              name="gsltToken"
              required
              minLength={8}
              maxLength={64}
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
            />
          </Field>

          <Field
            label="RCON password"
            hint="At least 8 characters. Used for CS2_RCONPW and, if Fake RCON is selected, copied into its config automatically."
          >
            <input
              name="rconPassword"
              type="password"
              required
              minLength={8}
              maxLength={64}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>

          <Field label="Join password" hint="Optional. Leave empty for a public server.">
            <input
              name="joinPassword"
              type="password"
              maxLength={64}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>

          <Field label="Game mode">
            <select name="gameMode" defaultValue={1} className={selectClass}>
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
                maps.find((map) => map.name === 'de_dust2')?.name ??
                maps[0]?.name ??
                'de_dust2'
              }
              required
            >
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
              defaultValue={10}
              className={inputClass}
            />
          </Field>

          <Field
            label="Extra launch arguments"
            hint="Optional, e.g. -tickrate 64. No shell syntax. VAC off adds -insecure separately."
          >
            <input name="extraArgs" maxLength={512} className={inputClass} />
          </Field>

          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              name="botsDisabled"
              defaultChecked
              className={clsx('mt-1', checkboxClass)}
            />
            <span>
              <span className="block text-sm text-ink-100">Disable bots</span>
              <span className="mt-0.5 block text-xs text-ink-400">
                Sets <span className="console-surface">bot_quota 0</span>. Recommended for
                match servers.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              name="vacDisabled"
              className={clsx('mt-1', checkboxClass)}
            />
            <span>
              <span className="block text-sm text-ink-100">Disable VAC</span>
              <span className="mt-0.5 block text-xs text-ink-400">
                Starts the server with <span className="console-surface">-insecure</span>.
                Needed for some plugins and community setups; players see an insecure server.
              </span>
            </span>
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Plugins"
          description="Optional. Versions are pinned; eZ-Match never resolves “latest”."
        />
        <ul className="divide-y divide-ink-700">
          {plugins.map((plugin) => {
            const checked = selected.includes(plugin.id);
            const forced = selected.some(
              (id) => id !== plugin.id && plugins.find((p) => p.id === id)?.requires.includes(plugin.id),
            );
            return (
              <li key={plugin.id} className="flex gap-3 px-5 py-4">
                <input
                  type="checkbox"
                  name="plugins"
                  value={plugin.id}
                  checked={checked}
                  disabled={forced}
                  onChange={() => toggle(plugin)}
                  className={clsx('mt-1', checkboxClass)}
                />
                <div className="min-w-0">
                  <p className="text-sm text-ink-100">
                    {plugin.name}{' '}
                    <span className="text-xs text-ink-400">{plugin.version}</span>
                    {forced ? (
                      <span className="ml-2 text-xs text-ink-400">
                        required by another selection
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-400">{plugin.summary}</p>
                  {plugin.caution ? (
                    <p className="mt-1 text-xs text-warn-500">{plugin.caution}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {tight ? (
        <Notice tone="warn">
          This host reports less than 86 GB free. CS2 needs about 60 GB, plus room
          for the copy SteamCMD makes while updating. The agent will refuse the
          install if space runs out mid-download.
        </Notice>
      ) : null}

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <div className="flex items-center gap-3">
        <Submit />
        <Link href={`/admin/servers/${serverId}`} className={secondaryButtonClass}>
          Cancel
        </Link>
        <p className="text-xs text-ink-400">
          The download runs for tens of minutes. You can close this page; progress
          is kept on the server page.
        </p>
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClass} disabled={pending}>
      {pending ? 'Starting…' : 'Install CS2'}
    </button>
  );
}
