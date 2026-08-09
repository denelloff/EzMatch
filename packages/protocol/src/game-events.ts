import { z } from 'zod';

/**
 * Coarse buckets used to split the log stream in the UI and to decide retention.
 * The mapping from `kind` to category lives in `categorizeEventKind` so new
 * rules can be added without touching the transport.
 */
export const zEventCategory = z.enum([
  'match',
  'combat',
  'chat',
  'connection',
  'server',
  'economy',
  'other',
]);
export type EventCategory = z.infer<typeof zEventCategory>;

/**
 * Event kinds the match state machine depends on. Anything the parser emits
 * outside this list still flows through as `other`, so unknown log lines are
 * never silently dropped.
 */
export const KNOWN_EVENT_KINDS = [
  'match_status',
  'round_start',
  'round_end',
  'round_stats',
  'game_over',
  'game_commencing',
  'team_score',
  'team_notice',
  'world_trigger',
  'map_loading',
  'map_started',
  'map_changed',
  'freeze_period_start',
  'warmup_end',
  'player_connect',
  'player_disconnect',
  'player_entered',
  'player_validated',
  'player_switched_team',
  'player_kill',
  'player_attack',
  'player_assist',
  'player_blinded',
  'player_say',
  'player_purchase',
  'player_money_change',
  'player_picked_up',
  'player_dropped',
  'bomb_planted',
  'bomb_defused',
  'server_cvar',
  'server_message',
  'rcon',
  'other',
] as const;

export const zEventKind = z.enum(KNOWN_EVENT_KINDS);
export type EventKind = z.infer<typeof zEventKind>;

const MATCH_KINDS = new Set<string>([
  'match_status',
  'round_start',
  'round_end',
  'round_stats',
  'game_over',
  'game_commencing',
  'team_score',
  'team_notice',
  'world_trigger',
  'map_loading',
  'map_started',
  'map_changed',
  'freeze_period_start',
  'warmup_end',
  'bomb_planted',
  'bomb_defused',
]);
const COMBAT_KINDS = new Set<string>([
  'player_kill',
  'player_attack',
  'player_assist',
  'player_blinded',
]);
const CONNECTION_KINDS = new Set<string>([
  'player_connect',
  'player_disconnect',
  'player_entered',
  'player_validated',
  'player_switched_team',
]);
const ECONOMY_KINDS = new Set<string>([
  'player_purchase',
  'player_money_change',
  'player_picked_up',
  'player_dropped',
]);
const SERVER_KINDS = new Set<string>(['server_cvar', 'server_message', 'rcon']);

export function categorizeEventKind(kind: string): EventCategory {
  if (MATCH_KINDS.has(kind)) return 'match';
  if (COMBAT_KINDS.has(kind)) return 'combat';
  if (CONNECTION_KINDS.has(kind)) return 'connection';
  if (ECONOMY_KINDS.has(kind)) return 'economy';
  if (SERVER_KINDS.has(kind)) return 'server';
  if (kind === 'player_say') return 'chat';
  return 'other';
}

export const zPlayerRef = z.object({
  name: z.string(),
  steamId: z.string().nullable(),
  side: z.string().nullable(),
  userId: z.number().int().nullable(),
});
export type PlayerRef = z.infer<typeof zPlayerRef>;

export const zGameEvent = z.object({
  /** Server-local timestamp from the log line, normalized to ISO-8601 UTC. */
  ts: z.string(),
  kind: zEventKind,
  category: zEventCategory,
  /** Parser-specific type name, kept so nothing is lost in normalization. */
  sourceType: z.string(),
  actor: zPlayerRef.nullable(),
  target: zPlayerRef.nullable(),
  data: z.record(z.string(), z.unknown()),
  /** Original log line. Secrets are redacted before this is populated. */
  raw: z.string(),
});
export type GameEvent = z.infer<typeof zGameEvent>;
