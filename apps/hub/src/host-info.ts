import type { HostInfo, NetworkSample } from '@ppanel/protocol';
import { db } from './db.js';

const NETWORK_HISTORY_LIMIT = 40;

/**
 * Merges a partial host snapshot into the stored HostInfo and appends a
 * network sample when rates are present. Heartbeats used to overwrite the
 * whole JSON blob with only disks+docker, wiping OS/arch/etc.
 */
export async function mergeServerHostInfo(
  serverId: string,
  patch: Partial<HostInfo> & { publicIp?: string | null },
): Promise<HostInfo> {
  const row = await db().server.findUnique({
    where: { id: serverId },
    select: { hostInfo: true },
  });
  const previous = (row?.hostInfo ?? {}) as Partial<HostInfo>;

  const history: NetworkSample[] = [...(previous.networkHistory ?? [])];
  if (
    patch.networkRxBytesPerSec != null &&
    patch.networkTxBytesPerSec != null &&
    Number.isFinite(patch.networkRxBytesPerSec) &&
    Number.isFinite(patch.networkTxBytesPerSec)
  ) {
    history.push({
      at: new Date().toISOString(),
      rxBytesPerSec: patch.networkRxBytesPerSec,
      txBytesPerSec: patch.networkTxBytesPerSec,
    });
    while (history.length > NETWORK_HISTORY_LIMIT) history.shift();
  }

  const next: HostInfo = {
    hostname: patch.hostname ?? previous.hostname ?? 'unknown',
    os: patch.os ?? previous.os ?? 'unknown',
    kernel: patch.kernel ?? previous.kernel ?? 'unknown',
    arch: patch.arch ?? previous.arch ?? 'unknown',
    cpuCount: patch.cpuCount ?? previous.cpuCount ?? 1,
    totalMemBytes: patch.totalMemBytes ?? previous.totalMemBytes ?? 0,
    dockerVersion:
      patch.dockerVersion !== undefined
        ? patch.dockerVersion
        : (previous.dockerVersion ?? null),
    disks: patch.disks ?? previous.disks ?? [],
    publicIp:
      patch.publicIp !== undefined
        ? patch.publicIp
        : (previous.publicIp ?? null),
    networkRxBytesPerSec:
      patch.networkRxBytesPerSec ?? previous.networkRxBytesPerSec,
    networkTxBytesPerSec:
      patch.networkTxBytesPerSec ?? previous.networkTxBytesPerSec,
    networkHistory: history,
  };

  await db().server.update({
    where: { id: serverId },
    data: { hostInfo: next as unknown as object },
  });

  return next;
}

