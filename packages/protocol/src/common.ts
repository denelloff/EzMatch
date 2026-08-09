import { z } from 'zod';

/**
 * Bumped whenever the wire format changes in a way older agents cannot handle.
 * The hub refuses agents announcing a different major version.
 */
export const PROTOCOL_VERSION = 1;

export const zId = z.string().min(1).max(64);

export const zIsoDate = z.string().min(1);

export const zInstanceState = z.enum([
  'creating',
  'installing',
  'stopped',
  'starting',
  'running',
  'stopping',
  'updating',
  'error',
  'removed',
]);
export type InstanceState = z.infer<typeof zInstanceState>;

export const zDiskInfo = z.object({
  path: z.string(),
  totalBytes: z.number().int().nonnegative(),
  freeBytes: z.number().int().nonnegative(),
});
export type DiskInfo = z.infer<typeof zDiskInfo>;

export const zNetworkSample = z.object({
  at: zIsoDate,
  rxBytesPerSec: z.number().nonnegative(),
  txBytesPerSec: z.number().nonnegative(),
});
export type NetworkSample = z.infer<typeof zNetworkSample>;

export const zHostInfo = z.object({
  hostname: z.string(),
  os: z.string(),
  kernel: z.string(),
  arch: z.string(),
  cpuCount: z.number().int().positive(),
  totalMemBytes: z.number().int().nonnegative(),
  dockerVersion: z.string().nullable(),
  disks: z.array(zDiskInfo),
  publicIp: z.string().nullable(),
  /** Instantaneous host container network ingress (agent + CS2), bytes/s. */
  networkRxBytesPerSec: z.number().nonnegative().optional(),
  /** Instantaneous host container network egress, bytes/s. */
  networkTxBytesPerSec: z.number().nonnegative().optional(),
  /**
   * Rolling samples for the panel sparkline. Agents send the current rates;
   * the hub appends to this ring and older agents simply omit it.
   */
  networkHistory: z.array(zNetworkSample).optional(),
});
export type HostInfo = z.infer<typeof zHostInfo>;

export const zPortAllocation = z.object({
  game: z.number().int().min(1024).max(65535),
  tv: z.number().int().min(1024).max(65535),
});
export type PortAllocation = z.infer<typeof zPortAllocation>;
