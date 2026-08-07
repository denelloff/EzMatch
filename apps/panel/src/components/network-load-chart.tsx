import type { NetworkSample } from '@ppanel/protocol';
import { formatBitrate } from '@/lib/format';

function polyline(
  samples: number[],
  width: number,
  height: number,
  max: number,
): string {
  if (samples.length === 0) return '';
  const den = Math.max(samples.length - 1, 1);
  return samples
    .map((value, index) => {
      const x = (index / den) * width;
      const y = height - (value / max) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function NetworkLoadChart({
  history,
  rxBytesPerSec,
  txBytesPerSec,
  title = 'Network',
  waiting = 'Waiting for heartbeat samples…',
}: {
  history?: NetworkSample[] | null;
  rxBytesPerSec?: number | null;
  txBytesPerSec?: number | null;
  title?: string;
  waiting?: string;
}) {
  const samples = history ?? [];
  const rx = samples.map((s) => s.rxBytesPerSec);
  const tx = samples.map((s) => s.txBytesPerSec);
  const peak = Math.max(1, ...rx, ...tx, rxBytesPerSec ?? 0, txBytesPerSec ?? 0);
  const width = 280;
  const height = 64;

  return (
    <div className="border-t border-ink-700 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-ink-400">{title}</p>
        <p className="text-[11px] text-ink-400">
          <span className="text-brand-500">↓ {formatBitrate(rxBytesPerSec)}</span>
          <span className="mx-1.5 text-ink-600">·</span>
          <span className="text-ok-500">↑ {formatBitrate(txBytesPerSec)}</span>
        </p>
      </div>

      {samples.length >= 2 ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-3 h-16 w-full"
          role="img"
          aria-label={title}
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-brand-500"
            points={polyline(rx, width, height, peak)}
          />
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-ok-500"
            points={polyline(tx, width, height, peak)}
          />
        </svg>
      ) : (
        <p className="mt-3 text-xs text-ink-500">{waiting}</p>
      )}
    </div>
  );
}
