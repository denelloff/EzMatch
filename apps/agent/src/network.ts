import { docker } from './docker/client.js';
import { log } from './logger.js';

interface Counters {
  at: number;
  rx: number;
  tx: number;
}

let previous: Counters | null = null;

/**
 * Sums rx/tx byte counters across running Docker containers. The agent itself
 * sits on a bridge network, so `/proc/net/dev` only shows its own veth; Docker
 * stats cover CS2 game traffic too.
 */
async function readContainerNetBytes(): Promise<{ rx: number; tx: number }> {
  const containers = await docker.listContainers({ all: false });
  let rx = 0;
  let tx = 0;

  await Promise.all(
    containers.map(async (summary) => {
      try {
        const stats = (await docker.getContainer(summary.Id).stats({
          stream: false,
        })) as {
          networks?: Record<string, { rx_bytes?: number; tx_bytes?: number }>;
        };
        for (const iface of Object.values(stats.networks ?? {})) {
          rx += iface.rx_bytes ?? 0;
          tx += iface.tx_bytes ?? 0;
        }
      } catch {
        // Container may have exited between list and stats.
      }
    }),
  );

  return { rx, tx };
}

export async function collectNetworkRates(): Promise<{
  networkRxBytesPerSec: number;
  networkTxBytesPerSec: number;
}> {
  try {
    const now = Date.now();
    const totals = await readContainerNetBytes();
    const current: Counters = { at: now, rx: totals.rx, tx: totals.tx };

    if (!previous || current.at <= previous.at) {
      previous = current;
      return { networkRxBytesPerSec: 0, networkTxBytesPerSec: 0 };
    }

    const elapsedSec = (current.at - previous.at) / 1000;
    const rxDelta = Math.max(0, current.rx - previous.rx);
    const txDelta = Math.max(0, current.tx - previous.tx);
    previous = current;

    return {
      networkRxBytesPerSec: Math.round(rxDelta / elapsedSec),
      networkTxBytesPerSec: Math.round(txDelta / elapsedSec),
    };
  } catch (error) {
    log.warn('network rate collection failed', { error });
    return { networkRxBytesPerSec: 0, networkTxBytesPerSec: 0 };
  }
}

