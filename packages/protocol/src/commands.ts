import { z } from 'zod';
import { zId, zPortAllocation } from './common.js';
import { zPluginId, zPluginSpec } from './plugins.js';

export const zGameType = z.number().int().min(0).max(1);
export const zGameMode = z.number().int().min(0).max(2);

/**
 * Structured server settings. The agent maps these onto the environment
 * variables of the `joedwards32/cs2` image; the panel never gets to inject raw
 * env or raw shell.
 */
export const zCs2Config = z.object({
  serverName: z.string().min(1).max(64),
  /** GSLT. Valve requires a distinct token per concurrently running instance. */
  gsltToken: z.string().min(1),
  rconPassword: z.string().min(8),
  joinPassword: z.string().default(''),
  maxPlayers: z.number().int().min(2).max(64).default(10),
  gameType: zGameType.default(0),
  gameMode: zGameMode.default(1),
  startMap: z.string().default('de_dust2'),
  lan: z.boolean().default(false),
  hibernate: z.boolean().default(false),
  /** Appended verbatim to the cs2 command line. Panel-side validated. */
  extraArgs: z.string().default(''),
});
export type Cs2Config = z.infer<typeof zCs2Config>;

export const zConsoleCommand = z.object({
  command: z.string().min(1).max(1024),
  /** Pause applied after the command before the next one in a batch. */
  delayMs: z.number().int().min(0).max(60_000).default(0),
});
export type ConsoleCommand = z.infer<typeof zConsoleCommand>;

export const zCommand = z.discriminatedUnion('type', [
  z.object({ type: z.literal('host.info') }),
  z.object({
    type: z.literal('host.diskCheck'),
    path: z.string(),
    minFreeBytes: z.number().int().positive(),
  }),

  z.object({
    type: z.literal('instance.create'),
    instanceId: zId,
    config: zCs2Config,
    ports: zPortAllocation,
    plugins: z.array(zPluginSpec).default([]),
    /** Refuse to start the ~60 GB SteamCMD download below this much free space. */
    minFreeBytes: z.number().int().positive(),
  }),
  z.object({ type: z.literal('instance.start'), instanceId: zId }),
  z.object({
    type: z.literal('instance.stop'),
    instanceId: zId,
    timeoutSec: z.number().int().min(1).max(300).default(30),
  }),
  z.object({ type: z.literal('instance.restart'), instanceId: zId }),
  z.object({
    type: z.literal('instance.remove'),
    instanceId: zId,
    removeVolume: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('instance.update'),
    instanceId: zId,
    validate: z.boolean().default(false),
  }),
  z.object({ type: z.literal('instance.inspect'), instanceId: zId }),
  z.object({ type: z.literal('instance.list') }),
  z.object({
    type: z.literal('instance.reconfigure'),
    instanceId: zId,
    config: zCs2Config,
  }),
  z.object({
    type: z.literal('instance.setRestartPolicy'),
    instanceId: zId,
    /**
     * Docker's own restart policy stays `no`. A container restart re-runs the
     * image entrypoint, which pulls whatever CS2 build Valve published; letting
     * Docker do that unsupervised is exactly how Metamod/CSS silently break.
     * The agent restarts instead, and records the build id each time.
     */
    autoRestart: z.boolean(),
  }),

  z.object({ type: z.literal('console.attach'), instanceId: zId }),
  z.object({ type: z.literal('console.detach'), instanceId: zId }),
  z.object({
    type: z.literal('console.send'),
    instanceId: zId,
    commands: z.array(zConsoleCommand).min(1).max(64),
    /** Collect console output for this long and return it with the result. */
    captureMs: z.number().int().min(0).max(30_000).default(0),
  }),

  z.object({
    type: z.literal('plugin.install'),
    instanceId: zId,
    plugin: zPluginSpec,
  }),
  z.object({
    type: z.literal('plugin.remove'),
    instanceId: zId,
    plugin: zPluginSpec,
  }),
  z.object({ type: z.literal('plugin.list'), instanceId: zId }),

  /** Indexes the GOTV recordings currently present in the instance volume. */
  z.object({ type: z.literal('demo.list'), instanceId: zId }),

  z.object({
    type: z.literal('logsink.apply'),
    instanceId: zId,
    /** Detail level for `mp_logdetail`; 3 logs both enemy and team attacks. */
    logDetail: z.number().int().min(0).max(3).default(3),
    logItems: z.boolean().default(false),
  }),
]);
export type Command = z.infer<typeof zCommand>;
export type CommandType = Command['type'];
