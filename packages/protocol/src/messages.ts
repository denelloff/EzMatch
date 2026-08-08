import { z } from 'zod';
import { zHostInfo, zId, zInstanceState, zIsoDate } from './common.js';
import { zCommand } from './commands.js';
import { zGameEvent } from './game-events.js';

export const zTaskPhase = z.enum([
  'queued',
  'preflight',
  'pulling-image',
  'creating-volume',
  'creating-container',
  'downloading-game',
  'installing-plugins',
  'starting',
  'stopping',
  'updating',
  'verifying',
  'done',
  'failed',
  'cancelled',
]);
export type TaskPhase = z.infer<typeof zTaskPhase>;

export const zInstanceSnapshot = z.object({
  instanceId: zId,
  state: zInstanceState,
  containerId: z.string().nullable(),
  /** Steam `buildid` from appmanifest_730.acf, used to detect CS2 updates. */
  buildId: z.string().nullable(),
  startedAt: zIsoDate.nullable(),
  error: z.string().nullable(),
});
export type InstanceSnapshot = z.infer<typeof zInstanceSnapshot>;

/**
 * Agent to hub. Every message carries `seq`, a per-connection monotonic counter.
 * Messages are buffered locally while the socket is down and replayed on
 * reconnect; the hub acknowledges with `ack` so the agent can drop them.
 */
export const zAgentMessage = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    seq: z.number().int().nonnegative(),
    protocolVersion: z.number().int().positive(),
    agentVersion: z.string(),
    host: zHostInfo,
    instances: z.array(zInstanceSnapshot),
  }),
  z.object({
    type: z.literal('pong'),
    seq: z.number().int().nonnegative(),
    ts: zIsoDate,
  }),
  z.object({
    type: z.literal('heartbeat'),
    seq: z.number().int().nonnegative(),
    ts: zIsoDate,
    host: zHostInfo.partial(),
  }),
  z.object({
    type: z.literal('taskProgress'),
    seq: z.number().int().nonnegative(),
    taskId: zId,
    phase: zTaskPhase,
    percent: z.number().min(0).max(100).nullable(),
    message: z.string(),
  }),
  z.object({
    type: z.literal('taskResult'),
    seq: z.number().int().nonnegative(),
    taskId: zId,
    ok: z.boolean(),
    data: z.unknown().nullable(),
    error: z.string().nullable(),
  }),
  z.object({
    type: z.literal('consoleLine'),
    seq: z.number().int().nonnegative(),
    instanceId: zId,
    ts: zIsoDate,
    line: z.string(),
  }),
  z.object({
    type: z.literal('gameEvents'),
    seq: z.number().int().nonnegative(),
    instanceId: zId,
    events: z.array(zGameEvent).min(1),
  }),
  z.object({
    type: z.literal('instanceState'),
    seq: z.number().int().nonnegative(),
    snapshot: zInstanceSnapshot,
  }),
]);
export type AgentMessage = z.infer<typeof zAgentMessage>;

/** Hub to agent. */
export const zHubMessage = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('welcome'),
    serverId: zId,
    heartbeatIntervalMs: z.number().int().positive(),
    /** Highest `seq` the hub already persisted, so replay can be trimmed. */
    resumeFromSeq: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal('ping'), ts: zIsoDate }),
  z.object({
    type: z.literal('ack'),
    upToSeq: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('command'),
    taskId: zId,
    command: zCommand,
  }),
  z.object({
    type: z.literal('cancel'),
    taskId: zId,
  }),
  z.object({
    type: z.literal('error'),
    code: z.string(),
    message: z.string(),
    fatal: z.boolean().default(false),
  }),
]);
export type HubMessage = z.infer<typeof zHubMessage>;

export function encodeMessage(msg: AgentMessage | HubMessage): string {
  return JSON.stringify(msg);
}

export function parseAgentMessage(raw: string): AgentMessage {
  return zAgentMessage.parse(JSON.parse(raw));
}

export function parseHubMessage(raw: string): HubMessage {
  return zHubMessage.parse(JSON.parse(raw));
}
