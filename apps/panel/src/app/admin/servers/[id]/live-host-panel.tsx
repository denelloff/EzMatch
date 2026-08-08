'use client';

import { useEffect, useState } from 'react';
import type { HostInfo } from '@ppanel/protocol';
import { NetworkLoadChart } from '@/components/network-load-chart';
import { Card, CardHeader } from '@/components/ui';
import { formatBytes } from '@/lib/format';

export type LiveHostLabels = {
  title: string;
  os: string;
  kernel: string;
  arch: string;
  cpus: string;
  memory: string;
  freeDisk: string;
  freeDiskFree: string;
  docker: string;
  agentToken: string;
  disks: string;
  diskFreeTotal: string;
  network: string;
  networkWaiting: string;
  live: string;
};

/**
 * Host card that follows agent heartbeats over SSE (`/api/stream/server/:id`).
 * Disk bars and the network sparkline update without a full page refresh.
 */
export function LiveHostPanel({
  serverId,
  initialHost,
  agentTokenValue,
  labels,
}: {
  serverId: string;
  initialHost: HostInfo | null;
  agentTokenValue: string;
  labels: LiveHostLabels;
}) {
  const [host, setHost] = useState<HostInfo | null>(initialHost);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setHost(initialHost);
  }, [initialHost]);

  useEffect(() => {
    const source = new EventSource(`/api/stream/server/${serverId}`);

    source.addEventListener('message', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent<string>).data) as {
          host?: HostInfo | null;
          status?: string;
        };
        if (data.host) {
          setHost(data.host);
          setLive(true);
        }
      } catch {
        // Ignore malformed frames.
      }
    });

    source.onerror = () => {
      setLive(false);
    };

    return () => source.close();
  }, [serverId]);

  return (
    <Card>
      <CardHeader
        title={labels.title}
        description={live ? labels.live : undefined}
      />
      <dl className="space-y-3 px-5 py-4 text-sm">
        <Row label={labels.os} value={host?.os ?? '—'} />
        <Row label={labels.kernel} value={host?.kernel ?? '—'} />
        <Row label={labels.arch} value={host?.arch ?? '—'} />
        <Row label={labels.cpus} value={host?.cpuCount?.toString() ?? '—'} />
        <Row label={labels.memory} value={formatBytes(host?.totalMemBytes)} />
        <Row
          label={labels.freeDisk}
          value={
            host?.disks?.length
              ? host.disks
                  .map((disk) =>
                    labels.freeDiskFree
                      .replace('{free}', formatBytes(disk.freeBytes))
                      .replace('{path}', disk.path),
                  )
                  .join(' · ')
              : '—'
          }
        />
        <Row label={labels.docker} value={host?.dockerVersion ?? '—'} />
        <Row label={labels.agentToken} value={agentTokenValue} />
      </dl>

      {host?.disks?.length ? (
        <div className="border-t border-ink-700/80 px-5 py-4">
          <p className="text-xs text-ink-400">{labels.disks}</p>
          <ul className="mt-2 space-y-2">
            {host.disks.map((disk) => (
              <li key={disk.path} className="text-sm">
                <div className="flex justify-between text-ink-200">
                  <span className="console-surface text-xs">{disk.path}</span>
                  <span className="text-xs">
                    {labels.diskFreeTotal
                      .replace('{free}', formatBytes(disk.freeBytes))
                      .replace('{total}', formatBytes(disk.totalBytes))}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((disk.totalBytes - disk.freeBytes) /
                            Math.max(disk.totalBytes, 1)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <NetworkLoadChart
        history={host?.networkHistory}
        rxBytesPerSec={host?.networkRxBytesPerSec}
        txBytesPerSec={host?.networkTxBytesPerSec}
        title={labels.network}
        waiting={labels.networkWaiting}
      />
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="truncate text-right text-ink-200">{value}</dd>
    </div>
  );
}
