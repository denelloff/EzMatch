import {
  categorizeEventKind,
  type GameEvent,
  type PlayerRef,
} from '@ppanel/protocol';

/**
 * CS2 Docker console often prints useful player lines even when the HTTP
 * logaddress sink is dead. These patterns are enough to keep the scoreboard
 * and !ready chat working without waiting for logaddress_add_http.
 */

const PLAYER_RE = /"([^"<]+)<(\d+)><([^>]*)><([^>]*)>"/;
const STEAM3_RE = /^\[U:1:(\d+)\]$/i;
const STEAM64_INLINE_RE =
  /steamid:(7656\d+)@[^\s]+\s+'([^']+)'/i;
// CS2 prints several leave shapes: `Dropped client 'x'`, `Dropped "x" from
// server: …`, `Client "x" disconnected`, and the classic quoted player line.
const DROPPED_RE =
  /(?:Dropped client|Disconnect client|Dropping client|Kicked)\s+'([^']+)'/i;
const DROPPED_QUOTED_RE =
  /Dropped\s+"([^"]+)"\s+from server/i;
const CLIENT_DISCONNECTED_RE =
  /Client\s+(?:#?\d+\s+)?"([^"]+)"\s+disconnected/i;
const SAY_RE =
  /"([^"<]+)<(\d+)><([^>]*)><([^>]*)>"\s+say(?:_team)?\s+"(.*)"/i;
const CHANGE_TEAM_RE =
  /"([^"<]+)<(\d+)><([^>]*)><([^>]*)>"\s+(?:ChangeTeam\(\)|SwitchTeam)\b/i;
const REQ_TEAM_RE = /req team\s+(\d+)/i;
const PENDING_TEAM_RE = /ChangeBasePlayerTeamAndPendingTeam\s*=\s*(\d+)/i;
const TEAM_WIN_RE =
  /Team\s+"(CT|TERRORIST|T)"\s+triggered\s+"(?:SFUI_Notice_)?(?:CTs?_Win|Terrorists?_Win|Target_Bombed|Bomb_Defused|Target_Saved|Hostages_Rescued)"/i;
const SFUI_WIN_RE =
  /(?:SFUI_Notice_)?(CTs?_Win|Terrorists?_Win|Target_Bombed|Bomb_Defused|Target_Saved)/i;

function steamIdFromRaw(raw: string): string | null {
  const value = raw.trim();
  if (!value || value === 'BOT' || value === 'Console') return null;
  if (/^7656\d+$/.test(value)) return value;
  const steam3 = STEAM3_RE.exec(value);
  if (steam3) {
    return String(BigInt('76561197960265728') + BigInt(steam3[1]!));
  }
  return value;
}

function sideFromLabel(team: string): string | null {
  const normalized = team.trim().toUpperCase();
  if (normalized === 'CT' || normalized === 'COUNTER-TERRORIST') return 'CT';
  if (normalized === 'TERRORIST' || normalized === 'T') return 'TERRORIST';
  return null;
}

/** CS2 team numbers: 2 = T, 3 = CT. */
export function sideFromTeamNumber(team: unknown): string | null {
  const n = typeof team === 'number' ? team : Number(team);
  if (n === 2) return 'TERRORIST';
  if (n === 3) return 'CT';
  return null;
}

function playerFromMatch(
  name: string,
  userId: string,
  steamRaw: string,
  team: string,
): PlayerRef | null {
  if (steamRaw.trim().toUpperCase() === 'BOT') return null;
  return {
    name,
    steamId: steamIdFromRaw(steamRaw),
    side: sideFromLabel(team),
    userId: Number.parseInt(userId, 10) || null,
  };
}

function event(
  kind: GameEvent['kind'],
  actor: PlayerRef | null,
  raw: string,
  data: Record<string, unknown> = {},
): GameEvent {
  return {
    ts: new Date().toISOString(),
    kind,
    category: categorizeEventKind(kind),
    sourceType: `console:${kind}`,
    actor,
    target: null,
    data,
    raw,
  };
}

/** Best-effort GameEvents extracted from a raw Docker console line. */
export function gameEventsFromConsoleLine(line: string): GameEvent[] {
  const text = line.replace(/\r?\n$/, '').trim();
  if (!text) return [];

  const say = SAY_RE.exec(text);
  if (say) {
    const actor = playerFromMatch(say[1]!, say[2]!, say[3]!, say[4]!);
    if (!actor) return [];
    return [event('player_say', actor, text, { text: say[5] ?? '', message: say[5] ?? '' })];
  }

  const change = CHANGE_TEAM_RE.exec(text);
  if (change) {
    const actor = playerFromMatch(change[1]!, change[2]!, change[3]!, change[4]!);
    if (!actor) return [];
    const req =
      REQ_TEAM_RE.exec(text)?.[1] ?? PENDING_TEAM_RE.exec(text)?.[1] ?? null;
    const side =
      sideFromTeamNumber(req) ?? actor.side ?? sideFromLabel(change[4]!);
    return [
      event(
        'player_switched_team',
        { ...actor, side },
        text,
        {
          toTeam: req ? Number(req) : undefined,
          to: side ?? undefined,
        },
      ),
    ];
  }

  const dropped =
    DROPPED_RE.exec(text) ??
    DROPPED_QUOTED_RE.exec(text) ??
    CLIENT_DISCONNECTED_RE.exec(text);
  if (dropped) {
    return [
      event('player_disconnect', {
        name: dropped[1]!,
        steamId: null,
        side: null,
        userId: null,
      }, text),
    ];
  }

  const steamClosed = STEAM64_INLINE_RE.exec(text);
  if (steamClosed && /closed|disconnect|exiting/i.test(text)) {
    return [
      event('player_disconnect', {
        name: steamClosed[2]!,
        steamId: steamClosed[1]!,
        side: null,
        userId: null,
      }, text),
    ];
  }

  // Generic quoted player line with a real Steam id — treat as presence.
  const generic = PLAYER_RE.exec(text);
  if (generic && steamIdFromRaw(generic[3]!)) {
    const actor = playerFromMatch(
      generic[1]!,
      generic[2]!,
      generic[3]!,
      generic[4]!,
    );
    if (!actor) return [];
    if (/disconnect|dropped|closed/i.test(text)) {
      return [event('player_disconnect', actor, text)];
    }
    if (/connected|entered the game/i.test(text)) {
      return [event('player_connect', actor, text)];
    }
  }

  // Round winner notices — needed to know who picks stay/switch after knife.
  const teamWin = TEAM_WIN_RE.exec(text) ?? SFUI_WIN_RE.exec(text);
  if (teamWin) {
    const token = (teamWin[1] ?? '').toUpperCase();
    const side =
      token.startsWith('CT') ||
      token === 'BOMB_DEFUSED' ||
      token === 'TARGET_SAVED' ||
      token === 'HOSTAGES_RESCUED'
        ? 'CT'
        : token.startsWith('T') || token === 'TARGET_BOMBED'
          ? 'TERRORIST'
          : null;
    if (side) {
      return [
        event('team_notice', null, text, {
          winner: side,
          to: side,
          notice: token,
        }),
      ];
    }
  }

  return [];
}
