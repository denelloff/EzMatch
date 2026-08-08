'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export interface TaskUpdate {
  taskId: string;
  status?: string;
  phase?: string;
  percent?: number | null;
  message?: string;
  error?: string | null;
}

const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'CANCELLED']);

export function useTaskStream(
  taskId: string,
  onDone?: 'refresh',
  /** Snapshot from the DB so the UI is not stuck on "queued" before SSE arrives. */
  initial?: TaskUpdate | null,
) {
  const [update, setUpdate] = useState<TaskUpdate | null>(
    initial ? { ...initial, taskId } : null,
  );
  const [log, setLog] = useState<string[]>(
    initial?.message ? [initial.message] : [],
  );
  const [live, setLive] = useState(
    () => !initial?.status || !TERMINAL.has(initial.status),
  );
  const router = useRouter();
  const pathname = usePathname();
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    if (initial?.status && TERMINAL.has(initial.status)) {
      setLive(false);
      return;
    }

    setLive(true);

    const apply = (data: TaskUpdate) => {
      if (finished.current) return;

      setUpdate((previous) => {
        if (previous?.status && TERMINAL.has(previous.status)) return previous;
        return { ...previous, ...data, taskId };
      });

      if (data.message) {
        setLog((lines) => {
          if (lines[lines.length - 1] === data.message) return lines;
          return [...lines.slice(-999), data.message!];
        });
      }

      if (data.status && TERMINAL.has(data.status) && !finished.current) {
        finished.current = true;
        setLive(false);
        source.close();
        if (onDone === 'refresh') {
          setTimeout(() => {
            router.replace(pathname);
            router.refresh();
          }, 800);
        }
      }
    };

    const source = new EventSource(`/api/stream/task/${taskId}`);

    source.addEventListener('message', (event) => {
      apply(JSON.parse((event as MessageEvent<string>).data) as TaskUpdate);
    });

    source.onerror = () => {
      if (finished.current) {
        source.close();
        setLive(false);
      }
    };

    return () => source.close();
  }, [taskId, onDone, router, pathname, initial?.status]);

  return { update, log, live };
}
