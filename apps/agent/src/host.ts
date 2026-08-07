import { readFile, statfs } from 'node:fs/promises';
import { arch, cpus, hostname, release, totalmem } from 'node:os';
import type { DiskInfo, HostInfo } from '@ppanel/protocol';
import { log } from './logger.js';

/**
 * Paths worth reporting. The Docker data root is the one that matters, since
 * that is where the CS2 volume lives, but it is discovered at runtime.
 */
const BASE_PATHS = ['/'];

let cachedOsName: string | null = null;

async function readOsName(): Promise<string> {
  if (cachedOsName) return cachedOsName;
  try {
    const contents = await readFile('/etc/os-release', 'utf8');
    const match = /^PRETTY_NAME="?([^"\n]+)"?/m.exec(contents);
    cachedOsName = match?.[1] ?? 'Linux';
  } catch {
    cachedOsName = 'Linux';
  }
  return cachedOsName;
}

async function readDisk(path: string): Promise<DiskInfo | null> {
  try {
    const stats = await statfs(path);
    return {
      path,
      totalBytes: Number(stats.blocks) * Number(stats.bsize),
      // bavail, not bfree: the reserved blocks are not usable by the agent.
      freeBytes: Number(stats.bavail) * Number(stats.bsize),
    };
  } catch {
    return null;
  }
}

export async function collectDisks(dockerRoot: string | null): Promise<DiskInfo[]> {
  const paths = new Set([...BASE_PATHS, ...(dockerRoot ? [dockerRoot] : [])]);
  const disks = await Promise.all([...paths].map((path) => readDisk(path)));
  return disks.filter((disk): disk is DiskInfo => disk !== null);
}

export async function freeBytesFor(path: string): Promise<number> {
  const disk = await readDisk(path);
  if (!disk) {
    log.warn('could not determine free space, assuming zero', { path });
    return 0;
  }
  return disk.freeBytes;
}

export async function collectHostInfo(input: {
  dockerVersion: string | null;
  dockerRoot: string | null;
}): Promise<HostInfo> {
  return {
    hostname: hostname(),
    os: await readOsName(),
    kernel: release(),
    arch: arch(),
    cpuCount: Math.max(cpus().length, 1),
    totalMemBytes: totalmem(),
    dockerVersion: input.dockerVersion,
    disks: await collectDisks(input.dockerRoot),
    // The hub fills this in from the socket it sees the agent connect on, which
    // is more reliable than anything the host can work out about itself.
    publicIp: null,
  };
}
