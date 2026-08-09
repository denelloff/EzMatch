'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui';

export interface FeedEvent {
  ts: string;
  kind: string;
  category: string;
  actor?: { name: string } | null;
  target?: { name: string } | null;
  data?: Record<string, unknown>;
}

const CATEGORY_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  match: 'ok',
  combat: 'danger',
  connection: 'info',
  server: 'warn',
  chat: 'neutral',
  economy: 'neutral',
  other: 'neutral',
};

const MAX_EVENTS = 200;

export function EventFeed({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial: FeedEvent[];
}) {
  const [events, setEvents] = useState<FeedEvent[]>(initial);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const source = new EventSource(`/api/stream/events/${instanceId}`);

    source.addEventListener('message', (event) => {
      const incoming = JSON.parse(
        (event as MessageEvent<string>).data,
      ) as FeedEvent[];
      setEvents((current) => [...incoming.reverse(), ...current].slice(0, MAX_EVENTS));
    });

    return () => source.close();
  }, [instanceId]);

  const categories = ['all', ...new Set(events.map((event) => event.category))];
  const visible =
    filter === 'all' ? events : events.filter((event) => event.category === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 border-b border-ink-700 px-5 py-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
              filter === category
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                : 'border-ink-700 text-ink-400 hover:border-ink-500'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-400">
          Nothing yet. Events appear once the server logs a round or a player
          connects.
        </p>
      ) : (
        <ul className="max-h-[28rem] divide-y divide-ink-800 overflow-auto">
          {visible.map((event, index) => (
            <li
              key={`${event.ts}-${index}`}
              className="flex items-start gap-3 px-5 py-2 text-sm"
            >
              <span className="console-surface w-16 shrink-0 text-xs text-ink-500">
                {new Date(event.ts).toLocaleTimeString()}
              </span>
              <Badge tone={CATEGORY_TONE[event.category] ?? 'neutral'}>
                {event.kind}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-ink-300">
                {describe(event)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function describe(event: FeedEvent): string {
  const actor = event.actor?.name;
  const target = event.target?.name;
  const data = event.data ?? {};

  const detail = Object.entries(data)
    .filter(([key]) => !['actor', 'target', 'raw'].includes(key))
    .slice(0, 4)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(' ');

  return [actor, target ? `→ ${target}` : null, detail]
    .filter(Boolean)
    .join(' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 40);
  return String(value).slice(0, 40);
}
