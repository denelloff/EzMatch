import parse, { type Event } from 'cs2-log-parser';
import {
  categorizeEventKind,
  redact,
  type EventKind,
  type GameEvent,
  type PlayerRef,
} from '@ppanel/protocol';

/**
 * `cs2-log-parser` covers the player-level lines (kills, connections, buys) and
 * the world triggers. It does not cover the match lifecycle lines the state
 * machine depends on, so those are matched here.
 *
 * Adding a rule means adding a regex to SUPPLEMENTAL; nothing about the
 * transport or storage has to change.
 */

const HTTP_PREFIX_RE = /^(\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}:\d{2})\.\d{3} - (.*)$/;
const FILE_PREFIX_RE = /^L?\s*(\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}:\d{2}):\s(.*)$/;

interface Split {
  ts: Date;
  body: string;
  format: 'http' | 'file';
  /** The line with any leading `L ` removed, as the parser expects it. */
  normalized: string;
}

function toDate(stamp: string): Date {
  const [datePart, timePart] = stamp.split(' - ');
  const [month, day, year] = (datePart ?? '').split('/');
  // CS2 writes local server time with no zone; treating it as UTC keeps
  // ordering correct and avoids a DST jump duplicating a round.
  const iso = `${year}-${month}-${day}T${timePart}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function splitLine(raw: string): Split | null {
  const line = raw.replace(/\r?\n$/, '').trim();
  if (!line) return null;

  const withoutMarker = line.startsWith('L ') ? line.slice(2) : line;

  const http = HTTP_PREFIX_RE.exec(withoutMarker);
  if (http) {
    return {
      ts: toDate(http[1]!),
      body: http[2]!,
      format: 'http',
      normalized: withoutMarker,
    };
  }

  const file = FILE_PREFIX_RE.exec(withoutMarker);
  if (file) {
    return {
      ts: toDate(file[1]!),
      body: file[2]!,
      format: 'file',
      normalized: withoutMarker,
    };
  }

  return null;
}

interface SupplementalRule {
  kind: EventKind;
  pattern: RegExp;
  extract: (match: RegExpExecArray) => Record<string, unknown>;
}

const SUPPLEMENTAL: SupplementalRule[] = [
  {
    kind: 'match_status',
    pattern:
      /^MatchStatus:\s*Score:\s*(\d+):(\d+)\s+on map\s+"([^"]+)"\s+RoundsPlayed:\s*(-?\d+)/i,
    extract: (match) => ({
      ctScore: Number.parseInt(match[1]!, 10),
      tScore: Number.parseInt(match[2]!, 10),
      map: match[3],
      roundsPlayed: Number.parseInt(match[4]!, 10),
    }),
  },
  {
    kind: 'match_status',
    pattern: /^MatchStatus:\s*Team playing\s+"(CT|TERRORIST)":\s*(.*)$/i,
    extract: (match) => ({ side: match[1]!.toUpperCase(), teamName: match[2]!.trim() }),
  },
  {
    kind: 'game_over',
    pattern:
      /^Game Over:\s*(\S+)\s+(\S+)\s+(\S+)\s+score\s+(\d+):(\d+)\s+after\s+(\d+)\s+min/i,
    extract: (match) => ({
      mode: match[1],
      mapGroup: match[2],
      map: match[3],
      ctScore: Number.parseInt(match[4]!, 10),
      tScore: Number.parseInt(match[5]!, 10),
      durationMinutes: Number.parseInt(match[6]!, 10),
    }),
  },
  {
    kind: 'map_loading',
    pattern: /^Loading map\s+"([^"]+)"/i,
    extract: (match) => ({ map: match[1] }),
  },
  {
    kind: 'map_started',
    pattern: /^Started map\s+"([^"]+)"/i,
    extract: (match) => ({ map: match[1] }),
  },
  {
    kind: 'map_changed',
    pattern: /^Changed map to\s+"?([^"\s]+)"?/i,
    extract: (match) => ({ map: match[1] }),
  },
  {
    kind: 'server_cvar',
    pattern: /^server_cvar:\s*"([^"]+)"\s*"([^"]*)"/i,
    extract: (match) => ({ cvar: match[1], value: match[2] }),
  },
  {
    kind: 'freeze_period_start',
    pattern: /^Starting Freeze period/i,
    extract: () => ({}),
  },
  {
    kind: 'server_message',
    pattern: /^Log file (started|closed)/i,
    extract: (match) => ({ action: match[1] }),
  },
];

const ENTITY_EVENT_KIND: Record<string, EventKind> = {
  round_start: 'round_start',
  round_end: 'round_end',
  match_start: 'match_status',
  game_commencing: 'game_commencing',
  warmup_start: 'match_status',
  warmup_end: 'warmup_end',
  planted_the_bomb: 'bomb_planted',
  defused_the_bomb: 'bomb_defused',
  begin_bomb_defuse_with_kit: 'world_trigger',
  begin_bomb_defuse_without_kit: 'world_trigger',
  got_the_bomb: 'world_trigger',
  dropped_the_bomb: 'world_trigger',
  touched_a_hostage: 'world_trigger',
  rescued_a_hostage: 'world_trigger',
};

const TEAM_NAMES = ['Unassigned', 'Spectators', 'TERRORIST', 'CT'];

function teamToSide(team: unknown): string | null {
  if (typeof team !== 'number') return null;
  return TEAM_NAMES[team] ?? null;
}

function toPlayerRef(entity: unknown): PlayerRef | null {
  if (!entity || typeof entity !== 'object') return null;
  const record = entity as Record<string, unknown>;
  if (record.type !== 'player' && record.type !== 'bot') return null;

  return {
    name: typeof record.name === 'string' ? record.name : 'unknown',
    steamId:
      typeof record.steamId64 === 'string'
        ? record.steamId64
        : typeof record.steamId === 'string'
          ? record.steamId
          : null,
    side: teamToSide(record.team),
    userId: typeof record.id === 'number' ? record.id : null,
  };
}

function kindForParsed(event: Event): EventKind {
  switch (event.name) {
    case 'killed':
    case 'killed_by_bomb':
    case 'suicide':
      return 'player_kill';
    case 'attacked':
      return 'player_attack';
    case 'assisted':
      return 'player_assist';
    case 'blinded':
      return 'player_blinded';
    case 'say':
      return 'player_say';
    case 'purchased':
      return 'player_purchase';
    case 'picked_up':
      return 'player_picked_up';
    case 'threw':
      return 'player_dropped';
    case 'scored':
      return 'team_score';
    case 'team_triggered':
      return 'team_notice';
    case 'switched_team':
      return 'player_switched_team';
    case 'rcon':
      return 'rcon';
    case 'connection': {
      const state = (event.payload as { state?: string }).state;
      if (state === 'connected') return 'player_connect';
      if (state === 'entered') return 'player_entered';
      return 'player_disconnect';
    }
    case 'entity_triggered': {
      const sub = (event.payload as { event?: string }).event ?? '';
      return ENTITY_EVENT_KIND[sub] ?? 'world_trigger';
    }
    default:
      return 'other';
  }
}

/** Payload shapes differ per event, so they are read defensively by key. */
function payloadOf(event: Event): Record<string, unknown> {
  return event.payload as unknown as Record<string, unknown>;
}

function actorTargetOf(event: Event): {
  actor: PlayerRef | null;
  target: PlayerRef | null;
} {
  const payload = payloadOf(event);
  switch (event.name) {
    case 'killed':
    case 'attacked':
      return {
        actor: toPlayerRef(payload.attacker),
        target: toPlayerRef(payload.victim),
      };
    case 'assisted':
    case 'blinded':
      return {
        actor: toPlayerRef(payload.attacker ?? payload.assister),
        target: toPlayerRef(payload.victim),
      };
    case 'connection':
    case 'switched_team':
    case 'say':
    case 'purchased':
    case 'picked_up':
    case 'threw':
    case 'suicide':
    case 'left_buyzone':
      return {
        actor: toPlayerRef(payload.client ?? payload.player ?? payload.entity),
        target: null,
      };
    case 'entity_triggered':
      return { actor: toPlayerRef(payload.entity), target: null };
    default:
      return { actor: null, target: null };
  }
}

export function normalizeLine(
  raw: string,
  secrets: readonly string[] = [],
): GameEvent | null {
  const trimmed = raw.replace(/\r?\n$/, '').trim();
  if (!trimmed) return null;

  // Docker attach often prints bare CS2 lines without the classic
  // `L MM/DD/YYYY - HH:MM:SS:` prefix. Those still carry map / round signals
  // the match runner depends on, so treat them as file-format bodies stamped now.
  const split =
    splitLine(trimmed) ??
    ({
      ts: new Date(),
      body: trimmed.startsWith('L ') ? trimmed.slice(2).trim() : trimmed,
      format: 'file' as const,
      normalized: trimmed,
    } satisfies Split);

  if (!split.body) return null;

  const safeRaw = redact(split.normalized, secrets);

  for (const rule of SUPPLEMENTAL) {
    const match = rule.pattern.exec(split.body);
    if (!match) continue;
    return {
      ts: split.ts.toISOString(),
      kind: rule.kind,
      category: categorizeEventKind(rule.kind),
      sourceType: `supplemental:${rule.kind}`,
      actor: null,
      target: null,
      data: rule.extract(match),
      raw: safeRaw,
    };
  }

  let parsed: Event | null = null;
  try {
    parsed = parse(split.normalized, { format: split.format });
  } catch {
    // A malformed line must not stop the rest of the batch.
    parsed = null;
  }

  if (!parsed) {
    return {
      ts: split.ts.toISOString(),
      kind: 'other',
      category: 'other',
      sourceType: 'unparsed',
      actor: null,
      target: null,
      data: { text: split.body },
      raw: safeRaw,
    };
  }

  const kind = kindForParsed(parsed);
  const { actor, target } = actorTargetOf(parsed);

  return {
    ts: parsed.receivedAt.toISOString(),
    kind,
    category: categorizeEventKind(kind),
    sourceType: parsed.name,
    actor,
    target,
    data: payloadOf(parsed),
    raw: safeRaw,
  };
}

export function normalizeBatch(
  body: string,
  secrets: readonly string[] = [],
): GameEvent[] {
  const events: GameEvent[] = [];
  for (const line of body.split('\n')) {
    const event = normalizeLine(line, secrets);
    if (event) events.push(event);
  }
  return events;
}
