'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface TaskUpdate {
  taskId: string;
  status?: string;
  phase?: string;
  percent?: number | null;
  message?: string;
  error?: string | null;
}

const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'TIMED_OUT']);

export function useTaskStream(taskId: string, onDone?: 'refresh') {
  const [update, setUpdate] = useState<TaskUpdate | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [live, setLive] = useState(true);
  const router = useRouter();
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    setLive(true);
    const source = new EventSource(`/api/stream/task/${taskId}`);

    source.addEventListener('message', (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as TaskUpdate;
      setUpdate((previous) => ({ ...previous, ...data }));

      if (data.message) {
        setLog((lines) => {
          if (lines[lines.length - 1] === data.message) return lines;
          return [...lines.slice(-499), data.message!];
        });
      }

      if (data.status && TERMINAL.has(data.status) && !finished.current) {
        finished.current = true;
        setLive(false);
        source.close();
        if (onDone === 'refresh') {
          setTimeout(() => router.refresh(), 1500);
        }
      }
    });

    source.onerror = () => {
      if (finished.current) {
        source.close();
        setLive(false);
      }
    };

    return () => source.close();
  }, [taskId, onDone, router]);

  return { update, log, live };
}
