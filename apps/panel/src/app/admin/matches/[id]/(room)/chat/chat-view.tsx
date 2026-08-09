'use client';

import { useEffect, useRef, useState } from 'react';
import { buttonClass, inputClass, Notice } from '@/components/ui';
import { sendConsoleAction } from '@/app/admin/instances/[id]/actions';

interface Line {
  ts: string;
  line: string;
  local?: boolean;
}

export function MatchChat({
  instanceId,
  canSend,
}: {
  instanceId: string;
  canSend: boolean;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = new EventSource(`/api/stream/console/${instanceId}?tail=300`);
    source.addEventListener('backfill', (event) => {
      const rows = JSON.parse((event as MessageEvent<string>).data) as Line[];
      setLines(rows.filter(isChatty).slice(-200));
    });
    source.addEventListener('message', (event) => {
      const row = JSON.parse((event as MessageEvent<string>).data) as Line;
      if (!isChatty(row)) return;
      setLines((current) => [...current, row].slice(-200));
    });
    return () => source.close();
  }, [instanceId]);

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
  }, [lines]);

  const send = async () => {
    const text = value.trim();
    if (!text || !canSend) return;
    setBusy(true);
    setError(null);
    const safe = text.replace(/["\\;\n\r]/g, '');
    const branded = safe.toUpperCase().startsWith('[EZ-MATCH]')
      ? safe
      : `[EZ-MATCH] ${safe}`;
    const result = await sendConsoleAction({
      instanceId,
      command: `say "${branded}"`,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLines((current) => [
      ...current,
      { ts: new Date().toISOString(), line: `> ${branded}`, local: true },
    ]);
    setValue('');
  };

  return (
    <div className="flex h-[min(55vh,32rem)] flex-col gap-3">
      <p className="text-xs text-ink-400">
        Messages go out as{' '}
        <span className="font-mono text-ink-300">[EZ-MATCH]</span> on the game
        server (colored when eZ-Match CSay is installed).
      </p>
      <div
        ref={viewport}
        className="console-surface min-h-0 flex-1 overflow-y-auto rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 font-mono text-xs leading-relaxed text-ink-200"
      >
        {lines.length === 0 ? (
          <p className="text-ink-500">No chat lines yet.</p>
        ) : (
          lines.map((line, index) => (
            <p
              key={`${line.ts}-${index}`}
              className={line.local ? 'text-brand-500' : undefined}
            >
              {line.line}
            </p>
          ))
        )}
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={value}
          disabled={!canSend || busy}
          placeholder={canSend ? 'Message to server…' : 'Read-only'}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          className={buttonClass}
          disabled={!canSend || busy || !value.trim()}
          onClick={() => void send()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function isChatty(line: Line): boolean {
  const text = line.line.toLowerCase();
  return (
    text.includes(' say ') ||
    text.startsWith('say ') ||
    text.includes('(all)') ||
    text.includes('(ct)') ||
    text.includes('(t)') ||
    text.includes(' : ') ||
    line.local === true
  );
}
