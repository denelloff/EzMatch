'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Estimates remaining time from percent samples. Needs at least two increasing
 * percent readings a few seconds apart; returns null while still learning.
 */
export function useProgressEta(
  percent: number | null,
  running: boolean,
): number | null {
  const samplesRef = useRef<{ t: number; p: number }[]>([]);
  const [etaMs, setEtaMs] = useState<number | null>(null);

  useEffect(() => {
    if (!running) {
      samplesRef.current = [];
      setEtaMs(null);
      return;
    }

    if (percent == null) {
      setEtaMs(null);
      return;
    }

    if (percent >= 99.5) {
      setEtaMs(0);
      return;
    }

    const now = Date.now();
    const samples = samplesRef.current;
    const last = samples[samples.length - 1];

    if (!last) {
      samples.push({ t: now, p: percent });
      setEtaMs(null);
      return;
    }

    if (percent > last.p + 0.05) {
      samples.push({ t: now, p: percent });
      while (samples.length > 16) samples.shift();
    }

    if (samples.length < 2) {
      setEtaMs(null);
      return;
    }

    const first = samples[0]!;
    const latest = samples[samples.length - 1]!;
    const dp = latest.p - first.p;
    const dt = latest.t - first.t;
    if (dp < 0.5 || dt < 2_000) {
      setEtaMs(null);
      return;
    }

    const remaining = ((100 - latest.p) * dt) / dp;
    setEtaMs(Math.min(Math.max(remaining, 0), 24 * 60 * 60_000));
  }, [percent, running]);

  return etaMs;
}
