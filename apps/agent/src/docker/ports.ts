import type { PortAllocation } from '@ppanel/protocol';
import { docker } from './client.js';
import { log } from '../logger.js';

const GAME_PORT_BASE = 27015;
const TV_PORT_BASE = 27020;
const SEARCH_RANGE = 100;

/**
 * Collects every host port already published by a container, running or not.
 * A stopped container still owns its binding as far as the next `docker run`
 * is concerned, so ignoring them would produce a container that refuses to
 * start much later, during the match rather than during setup.
 */
async function usedHostPorts(): Promise<Set<number>> {
  const used = new Set<number>();
  const containers = await docker.listContainers({ all: true });

  for (const container of containers) {
    for (const port of container.Ports ?? []) {
      if (port.PublicPort) used.add(port.PublicPort);
    }
    // `listContainers` omits bindings for stopped containers, so inspect them.
    if (container.State !== 'running') {
      try {
        const details = await docker.getContainer(container.Id).inspect();
        const bindings = (details.HostConfig?.PortBindings ?? {}) as Record<
          string,
          { HostPort?: string }[] | null
        >;
        for (const entries of Object.values(bindings)) {
          for (const binding of entries ?? []) {
            const value = Number.parseInt(binding.HostPort ?? '', 10);
            if (Number.isFinite(value)) used.add(value);
          }
        }
      } catch (error) {
        log.debug('could not inspect a container while scanning ports', { error });
      }
    }
  }

  return used;
}

function findFree(base: number, used: Set<number>, reserved: Set<number>): number {
  for (let offset = 0; offset < SEARCH_RANGE; offset += 1) {
    const candidate = base + offset;
    if (!used.has(candidate) && !reserved.has(candidate)) return candidate;
  }
  throw new Error(
    `No free port found in the range ${base}-${base + SEARCH_RANGE}`,
  );
}

/**
 * Confirms the requested ports are free, falling back to the next available
 * ones. The caller is told what was actually allocated.
 */
export async function allocatePorts(
  requested: PortAllocation,
): Promise<{ ports: PortAllocation; changed: boolean }> {
  const used = await usedHostPorts();
  const reserved = new Set<number>();

  const game = used.has(requested.game)
    ? findFree(GAME_PORT_BASE, used, reserved)
    : requested.game;
  reserved.add(game);

  const tv =
    used.has(requested.tv) || requested.tv === game
      ? findFree(TV_PORT_BASE, used, reserved)
      : requested.tv;

  return {
    ports: { game, tv },
    changed: game !== requested.game || tv !== requested.tv,
  };
}

