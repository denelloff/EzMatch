import { z } from 'zod';

export const zPluginId = z.enum([
  'metamod',
  'counterstrikesharp',
  'fake_rcon',
  'ez_csay',
]);
export type PluginId = z.infer<typeof zPluginId>;

export const zArchiveFormat = z.enum(['tar.gz', 'zip']);

/**
 * Installation is expressed as declarative steps rather than shell commands.
 *
 * The agent holds `/var/run/docker.sock`, which is root-equivalent on the host.
 * Letting the panel push arbitrary commands over the wire would turn a panel
 * compromise into root on every game server, so the agent only understands this
 * fixed, auditable vocabulary.
 */
export const zInstallStep = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('download-extract'),
    url: z.string(),
    archive: zArchiveFormat,
    /** Hex-encoded SHA-256 of the archive. Verified before extraction. */
    sha256: z.string().length(64).nullable(),
    /** Destination relative to the CS2 install root inside the volume. */
    dest: z.string(),
    /** Leading path components to strip from archive entries. */
    stripComponents: z.number().int().min(0).max(8).default(0),
  }),
  z.object({
    kind: z.literal('ensure-line-in-file'),
    /** Path relative to the CS2 install root. */
    file: z.string(),
    /** The line is inserted right after the first line matching this text. */
    afterLine: z.string(),
    line: z.string(),
  }),
  z.object({
    kind: z.literal('write-file'),
    file: z.string(),
    contentBase64: z.string(),
    /** Skip if the file already exists (used for secrets like rcon.txt). */
    skipIfExists: z.boolean().default(false),
  }),
  z.object({
    kind: z.literal('ensure-dir'),
    path: z.string(),
  }),
  z.object({
    kind: z.literal('remove-path'),
    path: z.string(),
  }),
]);
export type InstallStep = z.infer<typeof zInstallStep>;

export const zPluginSpec = z.object({
  id: zPluginId,
  /** Pinned version. Never "latest": a silent bump can break the server. */
  version: z.string().min(1),
  requires: z.array(zPluginId).default([]),
  install: z.array(zInstallStep),
  uninstall: z.array(zInstallStep).default([]),
  /** Console command whose output proves the plugin loaded, e.g. `meta list`. */
  verifyCommand: z.string().nullable().default(null),
  /** Substring expected in the verify command output. */
  verifyExpect: z.string().nullable().default(null),
});
export type PluginSpec = z.infer<typeof zPluginSpec>;
