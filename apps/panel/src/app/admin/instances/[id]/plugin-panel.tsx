'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { PluginCatalogEntry } from '@ppanel/protocol';
import { TaskProgress } from '@/components/task-progress';
import {
  Badge,
  dangerButtonClass,
  secondaryButtonClass,
} from '@/components/ui';
import { pluginAction, type PluginActionState } from './actions';

export interface InstalledPlugin {
  pluginId: string;
  version: string;
  status: string;
  lastError: string | null;
}

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  INSTALLED: 'ok',
  PENDING: 'neutral',
  FAILED: 'danger',
  REMOVED: 'neutral',
  NEEDS_RECHECK: 'warn',
};

export function PluginPanel({
  instanceId,
  catalog,
  installed,
  canAdmin,
  staleBuild,
}: {
  instanceId: string;
  catalog: PluginCatalogEntry[];
  installed: InstalledPlugin[];
  canAdmin: boolean;
  staleBuild: boolean;
}) {
  const [result, formAction] = useActionState<PluginActionState, FormData>(
    pluginAction,
    { error: null, taskId: null, message: null, title: null },
  );

  const byId = new Map(installed.map((entry) => [entry.pluginId, entry]));
  const hasInstalled = installed.some((entry) => entry.status === 'INSTALLED');

  return (
    <div>
      {staleBuild ? (
        <p className="border-b border-warn-500/40 bg-warn-500/10 px-5 py-3 text-sm text-warn-500">
          CS2 was updated after these plugins were last verified. Run{' '}
          <code className="console-surface">meta list</code> in the console, and
          reinstall anything that no longer loads.
        </p>
      ) : null}

      {canAdmin ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-700 px-5 py-3">
          <form action={formAction}>
            <input type="hidden" name="instanceId" value={instanceId} />
            <input type="hidden" name="action" value="check-updates" />
            <SubmitButton label="Check for updates" disabled={!canAdmin} />
          </form>
          <form action={formAction}>
            <input type="hidden" name="instanceId" value={instanceId} />
            <input type="hidden" name="action" value="remove-all" />
            <SubmitButton
              label="Remove all plugins"
              disabled={!canAdmin || !hasInstalled}
              danger
            />
          </form>
        </div>
      ) : null}

      <ul className="divide-y divide-ink-700">
        {catalog.map((plugin) => {
          const current = byId.get(plugin.id);
          const active = current?.status === 'INSTALLED';
          const updateAvailable =
            current?.status === 'NEEDS_RECHECK' ||
            (current?.status === 'INSTALLED' &&
              current.version !== 'pending' &&
              current.version !== plugin.version);
          return (
            <li key={plugin.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink-100">
                    {plugin.name}
                    <span className="text-xs text-ink-400">
                      {current?.version && current.version !== 'pending'
                        ? current.version
                        : plugin.version}
                    </span>
                    {current ? (
                      <Badge tone={STATUS_TONE[current.status] ?? 'neutral'}>
                        {current.status.toLowerCase()}
                      </Badge>
                    ) : null}
                    {updateAvailable ? (
                      <Badge tone="warn">
                        update {plugin.version}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-400">{plugin.summary}</p>
                  {current?.lastError ? (
                    <p className="mt-1 text-xs text-danger-500">{current.lastError}</p>
                  ) : plugin.caution ? (
                    <p className="mt-1 text-xs text-ink-500">{plugin.caution}</p>
                  ) : null}
                </div>

                <form action={formAction} className="shrink-0">
                  <input type="hidden" name="instanceId" value={instanceId} />
                  <input type="hidden" name="pluginId" value={plugin.id} />
                  <input
                    type="hidden"
                    name="action"
                    value={active ? 'remove' : 'install'}
                  />
                  <SubmitButton
                    label={
                      active
                        ? 'Remove'
                        : updateAvailable
                          ? 'Update'
                          : current
                            ? 'Reinstall'
                            : 'Install'
                    }
                    disabled={!canAdmin}
                  />
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      {result.error ? (
        <p className="border-t border-danger-500/40 bg-danger-500/10 px-5 py-3 text-sm text-danger-500">
          {result.error}
        </p>
      ) : null}

      {result.message ? (
        <pre className="border-t border-ink-700 bg-ink-950/50 px-5 py-3 text-xs leading-relaxed text-ink-300 whitespace-pre-wrap">
          {result.message}
        </pre>
      ) : null}

      {result.taskId ? (
        <div className="border-t border-ink-700 p-4">
          <TaskProgress
            key={result.taskId}
            taskId={result.taskId}
            title={result.title ?? 'Working'}
            onDone="refresh"
          />
        </div>
      ) : null}
    </div>
  );
}

function SubmitButton({
  label,
  disabled,
  danger = false,
}: {
  label: string;
  disabled: boolean;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={danger ? dangerButtonClass : secondaryButtonClass}
      disabled={disabled || pending}
    >
      {pending ? 'Working…' : label}
    </button>
  );
}
