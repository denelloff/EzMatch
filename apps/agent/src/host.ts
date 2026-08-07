import { readFile, statfs } from 'node:fs/promises';
import { arch, cpus, hostname, release, totalmem } from 'node:os';
import type { DiskInfo, HostInfo } from '@ppanel/protocol';
import { docker, pullImage } from './docker/client.js';
import { log } from './logger.js';

/**
 * Paths worth reporting. The Docker data root is the one that matters, since
 * that is where the CS2 volume lives, but it is discovered at runtime.
 */
const BASE_PATHS = ['/'];

/** Optional bind of the host root into the agent (`-v /:/host:ro`). */
const HOST_ROOT = '/host';

const DISK_PROBE_IMAGE = process.env.PPANEL_DISK_PROBE_IMAGE ?? 'alpine:3.20';

let cachedOsName: string | null = null;
let probeImageReady = false;

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

/**
 * The agent runs in a container. `statfs('/var/lib/docker')` sees the
 * container's tiny overlay (or fails) — not the host disk where volumes live.
 * Prefer `/host…` when the bootstrap mounted the host root, else probe via a
 * short-lived container that bind-mounts `/`.
 */
export async function freeBytesFor(path: string): Promise<number> {
  const candidates = hostAwarePaths(path);
  for (const candidate of candidates) {
    const disk = await readDisk(candidate);
    // Ignore tiny filesystems (container overlay is typically a few GB).
    if (disk && disk.totalBytes >= 20 * 1024 ** 3) {
      return disk.freeBytes;
    }
  }

  try {
    const viaDocker = await freeBytesViaDockerProbe(path);
    if (viaDocker != null) return viaDocker;
  } catch (error) {
    log.warn('docker disk probe failed', { path, error });
  }

  for (const candidate of candidates) {
    const disk = await readDisk(candidate);
    if (disk) return disk.freeBytes;
  }

  log.warn('could not determine free space, assuming zero', { path });
  return 0;
}

function hostAwarePaths(path: string): string[] {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return [`${HOST_ROOT}${normalized}`, normalized, HOST_ROOT, '/'];
}

async function freeBytesViaDockerProbe(hostPath: string): Promise<number | null> {
  await ensureProbeImage();
  const normalized = hostPath.startsWith('/') ? hostPath : `/${hostPath}`;
  const target = `${HOST_ROOT}${normalized === '/' ? '' : normalized}`;

  const container = await docker.createContainer({
    Image: DISK_PROBE_IMAGE,
    Cmd: ['df', '-PB1', target],
    Tty: true,
    HostConfig: {
      Binds: ['/:/host:ro'],
      NetworkMode: 'none',
      AutoRemove: false,
    },
  });

  try {
    await container.start();
    const result = await container.wait();
    const raw = await container.logs({ stdout: true, stderr: true });
    const text = Buffer.isBuffer(raw)
      ? raw.toString('utf8')
      : Buffer.from(raw as ArrayBuffer).toString('utf8');
    // dockerode may prefix multiplexed headers — strip non-printable noise.
    const cleaned = text.replace(/[^\n\t\x20-\x7e]/g, '');
    if (result.StatusCode !== 0) {
      log.warn('df probe exited non-zero', { code: result.StatusCode, cleaned });
      return null;
    }
    const line = cleaned.split('\n').map((row) => row.trim()).find((row) => /^\S+\s+\d+/.test(row) && !row.startsWith('Filesystem'));
    if (!line) return null;
    const parts = line.split(/\s+/);
    const available = Number.parseInt(parts[3] ?? '', 10);
    return Number.isFinite(available) ? available : null;
  } finally {
    await container.remove({ force: true }).catch(() => undefined);
  }
}

async function ensureProbeImage(): Promise<void> {
  if (probeImageReady) return;
  try {
    await docker.getImage(DISK_PROBE_IMAGE).inspect();
  } catch {
    log.info('pulling disk probe image', { image: DISK_PROBE_IMAGE });
    await pullImage(DISK_PROBE_IMAGE);
  }
  probeImageReady = true;
}

export async function collectDisks(dockerRoot: string | null): Promise<DiskInfo[]> {
  const paths = new Set([...BASE_PATHS, ...(dockerRoot ? [dockerRoot] : [])]);
  const disks: DiskInfo[] = [];

  for (const path of paths) {
    const freeBytes = await freeBytesFor(path);
    // Reconstruct a DiskInfo for the UI using the host-aware free figure.
    const local =
      (await readDisk(`${HOST_ROOT}${path}`)) ?? (await readDisk(path));
    disks.push({
      path,
      totalBytes: local?.totalBytes && local.totalBytes >= 20 * 1024 ** 3
        ? local.totalBytes
        : Math.max(freeBytes, local?.totalBytes ?? 0),
      freeBytes,
    });
  }

  return disks;
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
