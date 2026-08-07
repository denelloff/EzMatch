'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, inputClass } from '@/components/ui';
import { sendConsoleAction } from './actions';

interface ConsoleLine {
  ts: string;
  line: string;
  /** Locally echoed input, kept apart from what the server actually printed. */
  local?: boolean;
}

const MAX_LINES = 2000;

/** Offered as completions; the list is short on purpose, it is not a manual. */
const SUGGESTIONS = [
  'status',
  'stats',
  'meta list',
  'css_plugins list',
  'changelevel de_dust2',
  'mp_warmup_end',
  'mp_restartgame 1',
  'mp_pause_match',
  'mp_unpause_match',
  'mp_backup_restore_list_files',
  'say ',
  'users',
  'version',
];

export function ConsoleView({
  instanceId,
  canSend,
  running,
}: {
  instanceId: string;
  canSend: boolean;
  running: boolean;
}) {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [connected, setConnected] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const viewport = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  const append = useCallback((incoming: ConsoleLine[]) => {
    setLines((current) => [...current, ...incoming].slice(-MAX_LINES));
  }, []);

  useEffect(() => {
    const source = new EventSource(`/api/stream/console/${instanceId}?tail=500`);

    source.addEventListener('backfill', (event) => {
      const rows = JSON.parse((event as MessageEvent<string>).data) as ConsoleLine[];
      setLines(rows.slice(-MAX_LINES));
      setConnected(true);
    });

    source.addEventListener('message', (event) => {
      const row = JSON.parse((event as MessageEvent<string>).data) as ConsoleLine;
      append([row]);
      setConnected(true);
    });

    source.onerror = () => setConnected(false);

    return () => source.close();
  }, [instanceId, append]);

  // Autoscroll, but only while the operator is already at the bottom: yanking
  // the view away mid-scroll makes reading a stack trace impossible.
  useEffect(() => {
    const element = viewport.current;
    if (!element || !pinned.current) return;
    element.scrollTop = element.scrollHeight;
  }, [lines]);

  const onScroll = () => {
    const element = viewport.current;
    if (!element) return;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    pinned.current = distance < 40;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const command = value.trim();
    if (!command || busy) return;

    setBusy(true);
    setError(null);
    setValue('');
    setHistory((current) => [...current.filter((entry) => entry !== command), command].slice(-100));
    setHistoryIndex(null);
    pinned.current = true;
    append([{ ts: new Date().toISOString(), line: `> ${command}`, local: true }]);

    const result = await sendConsoleAction({ instanceId, command });
    if (!result.ok) {
      setError(result.error);
    } else if (result.output.length > 0) {
      // The stream carries the same output, so only lines the capture window
      // caught but the stream has not delivered yet would be duplicated. Drop
      // anything already present to keep the tail readable.
      setLines((current) => {
        const seen = new Set(current.slice(-200).map((entry) => entry.line));
        const fresh = result.output
          .filter((line) => !seen.has(line))
          .map((line) => ({ ts: new Date().toISOString(), line }));
        return [...current, ...fresh].slice(-MAX_LINES);
      });
    }
    setBusy(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(history[next] ?? '');
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === null) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        setValue('');
        return;
      }
      setHistoryIndex(next);
      setValue(history[next] ?? '');
    }
  };

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
        <div>
          <h2 className="text-sm font-medium text-ink-100">Console</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Attached to the container. Passwords and tokens are masked.
          </p>
        </div>
        <Badge tone={connected ? 'ok' : 'warn'}>
          {connected ? 'streaming' : 'reconnecting'}
        </Badge>
      </div>

      <div
        ref={viewport}
        onScroll={onScroll}
        className="console-surface flex-1 overflow-auto bg-ink-950 px-4 py-3 text-xs leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="text-ink-500">No output yet.</p>
        ) : (
          lines.map((entry, index) => (
            <div
              key={`${entry.ts}-${index}`}
              className={entry.local ? 'text-brand-500' : 'text-ink-300'}
            >
              {entry.line}
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="border-t border-danger-500/40 bg-danger-500/10 px-5 py-2 text-xs text-danger-500">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} className="border-t border-ink-700 px-4 py-3">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          list="ppanel-console-suggestions"
          disabled={!canSend || !running || busy}
          spellCheck={false}
          autoComplete="off"
          placeholder={
            !canSend
              ? 'Your role cannot send console commands'
              : running
                ? 'status'
                : 'The server is not running'
          }
          className={`${inputClass} font-mono`}
        />
        <datalist id="ppanel-console-suggestions">
          {SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </form>
    </div>
  );
}
