import { prisma } from '@/lib/db';

/**
 * Statistics are derived from the stored log stream rather than a pre-built
 * summary table. A match holds a few hundred kills and a few thousand hits, so
 * aggregating per request stays cheap and nothing can drift out of sync with
 * the events it came from.
 */

export type Vector = [number, number, number];

export interface KillRecord {
  ts: Date;
  killerSteamId: string | null;
  killerName: string | null;
  killerSide: string | null;
  victimSteamId: string | null;
  victimName: string | null;
  victimSide: string | null;
  /** `null` for bomb deaths, where the log names no weapon. */
  weapon: string | null;
  headshot: boolean;
  penetrated: boolean;
  noscope: boolean;
  throughSmoke: boolean;
  killerPos: Vector | null;
  victimPos: Vector | null;
  selfInflicted: boolean;
}

export interface HitRecord {
  attackerSteamId: string | null;
  victimSteamId: string | null;
  weapon: string;
  damage: number;
  hitGroup: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asVector(value: unknown): Vector | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const [x, y, z] = value;
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    return null;
  }
  return [x, y, z];
}

function hasModifier(value: unknown, modifier: string): boolean {
  return Array.isArray(value) && value.includes(modifier);
}

export async function loadKills(matchId: string): Promise<KillRecord[]> {
  const rows = await prisma.gameEvent.findMany({
    where: { matchId, kind: 'player_kill' },
    orderBy: { ts: 'asc' },
    select: {
      ts: true,
      sourceType: true,
      actorName: true,
      actorSteamId: true,
      actorSide: true,
      targetName: true,
      targetSteamId: true,
      targetSide: true,
      data: true,
    },
  });

  return rows.map((row) => {
    const data = asRecord(row.data);
    const modifiers = data.modifiers;
    const suicide = row.sourceType === 'suicide';

    return {
      ts: row.ts,
      killerSteamId: row.actorSteamId,
      killerName: row.actorName,
      killerSide: row.actorSide,
      victimSteamId: suicide ? row.actorSteamId : row.targetSteamId,
      victimName: suicide ? row.actorName : row.targetName,
      victimSide: suicide ? row.actorSide : row.targetSide,
      weapon:
        typeof data.weapon === 'string'
          ? data.weapon
          : typeof data.method === 'string'
            ? data.method
            : row.sourceType === 'killed_by_bomb'
              ? 'bomb'
              : null,
      headshot: hasModifier(modifiers, 'headshot'),
      penetrated: hasModifier(modifiers, 'penetrated'),
      noscope: hasModifier(modifiers, 'noscope'),
      throughSmoke: hasModifier(modifiers, 'throughsmoke'),
      killerPos: asVector(asRecord(data.attacker).position),
      victimPos: asVector(
        asRecord(suicide ? data.player : data.victim).position ?? data.position,
      ),
      selfInflicted: suicide,
    };
  });
}

export async function loadHits(matchId: string): Promise<HitRecord[]> {
  const rows = await prisma.gameEvent.findMany({
    where: { matchId, kind: 'player_attack' },
    select: { actorSteamId: true, targetSteamId: true, data: true },
  });

  const hits: HitRecord[] = [];
  for (const row of rows) {
    const data = asRecord(row.data);
    if (typeof data.weapon !== 'string') continue;
    hits.push({
      attackerSteamId: row.actorSteamId,
      victimSteamId: row.targetSteamId,
      weapon: data.weapon,
      damage: typeof data.damage === 'number' ? data.damage : 0,
      hitGroup: typeof data.hitGroup === 'string' ? data.hitGroup : 'generic',
    });
  }
  return hits;
}

export interface WeaponStat {
  weapon: string;
  kills: number;
  headshots: number;
  /** Share of this weapon's kills that were headshots, 0–100. */
  headshotPercent: number;
  hits: number;
  damage: number;
}

export function weaponStats(kills: KillRecord[], hits: HitRecord[]): WeaponStat[] {
  const table = new Map<string, WeaponStat>();

  const entry = (weapon: string): WeaponStat => {
    let stat = table.get(weapon);
    if (!stat) {
      stat = {
        weapon,
        kills: 0,
        headshots: 0,
        headshotPercent: 0,
        hits: 0,
        damage: 0,
      };
      table.set(weapon, stat);
    }
    return stat;
  };

  for (const kill of kills) {
    if (!kill.weapon || kill.selfInflicted) continue;
    const stat = entry(kill.weapon);
    stat.kills += 1;
    if (kill.headshot) stat.headshots += 1;
  }

  for (const hit of hits) {
    const stat = entry(hit.weapon);
    stat.hits += 1;
    stat.damage += hit.damage;
  }

  const stats = [...table.values()];
  for (const stat of stats) {
    stat.headshotPercent = stat.kills > 0 ? (stat.headshots / stat.kills) * 100 : 0;
  }

  return stats.sort((a, b) => b.kills - a.kills || b.damage - a.damage);
}

export interface PlayerStat {
  steamId: string;
  name: string;
  team: number;
  connected: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshots: number;
  /** Share of this player's kills that were headshots, 0–100. */
  headshotPercent: number;
  /** Average damage per round. */
  adr: number;
  /** Kills divided by deaths; equals kills when the player never died. */
  kdr: number;
  diff: number;
}

export interface StoredPlayer {
  steamId: string;
  name: string;
  team: number;
  connected: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
}

export function playerStats(
  players: StoredPlayer[],
  kills: KillRecord[],
  roundsPlayed: number,
): PlayerStat[] {
  const headshots = new Map<string, number>();
  for (const kill of kills) {
    if (!kill.headshot || !kill.killerSteamId || kill.selfInflicted) continue;
    headshots.set(kill.killerSteamId, (headshots.get(kill.killerSteamId) ?? 0) + 1);
  }

  const rounds = Math.max(roundsPlayed, 1);

  return players
    .map((player) => {
      const hs = headshots.get(player.steamId) ?? 0;
      return {
        ...player,
        headshots: hs,
        headshotPercent: player.kills > 0 ? (hs / player.kills) * 100 : 0,
        adr: player.damage / rounds,
        kdr: player.deaths > 0 ? player.kills / player.deaths : player.kills,
        diff: player.kills - player.deaths,
      };
    })
    .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
}

export interface DuelMatrix {
  players: { steamId: string; name: string; team: number }[];
  /** `counts[killer][victim]` — how often the row player killed the column player. */
  counts: number[][];
}

export function duelMatrix(
  players: StoredPlayer[],
  kills: KillRecord[],
): DuelMatrix {
  const ordered = [...players].sort(
    (a, b) => a.team - b.team || a.name.localeCompare(b.name),
  );
  const index = new Map(ordered.map((player, position) => [player.steamId, position]));
  const counts = ordered.map(() => ordered.map(() => 0));

  for (const kill of kills) {
    if (kill.selfInflicted) continue;
    if (!kill.killerSteamId || !kill.victimSteamId) continue;
    const killer = index.get(kill.killerSteamId);
    const victim = index.get(kill.victimSteamId);
    if (killer === undefined || victim === undefined) continue;
    counts[killer][victim] += 1;
  }

  return {
    players: ordered.map(({ steamId, name, team }) => ({ steamId, name, team })),
    counts,
  };
}

export interface RoundRecord {
  round: number;
  ctScore: number;
  tScore: number;
  /** Which side took this round, derived from which score advanced. */
  winner: 'CT' | 'T' | null;
}

/**
 * How many times the sides have swapped before the given round. CS2 swaps at
 * the regulation halftime, again when overtime begins, and then every overtime
 * half. Needed because the score in the logs is per side, not per team.
 */
export function sideSwapsBefore(
  round: number,
  maxRounds: number,
  overtimeRounds: number,
): number {
  const half = Math.floor(maxRounds / 2);
  if (round <= half) return 0;
  if (round <= maxRounds) return 1;

  const overtimeHalf = Math.max(Math.floor(overtimeRounds / 2), 1);
  return 2 + Math.floor((round - maxRounds - 1) / overtimeHalf);
}

/**
 * Rebuilds which team held CT in a given round. `team1SideNow` is the side
 * team 1 holds at `roundsPlayed`, so the chain is walked backwards from there.
 */
export function team1WasCt(
  round: number,
  team1SideNow: string,
  roundsPlayed: number,
  maxRounds: number,
  overtimeRounds: number,
): boolean {
  const swapsNow = sideSwapsBefore(roundsPlayed + 1, maxRounds, overtimeRounds);
  const swapsThen = sideSwapsBefore(round, maxRounds, overtimeRounds);
  const flipped = (swapsNow - swapsThen) % 2 !== 0;
  const isCtNow = team1SideNow === 'CT';
  return flipped ? !isCtNow : isCtNow;
}

/**
 * CS2 round-end log lines carry no winner, so the round timeline is rebuilt
 * from consecutive `match_status` snapshots: whichever side's score advanced
 * took the round.
 */
export async function loadRounds(matchId: string): Promise<RoundRecord[]> {
  const rows = await prisma.gameEvent.findMany({
    where: { matchId, kind: 'match_status' },
    orderBy: { ts: 'asc' },
    select: { data: true },
  });

  const rounds: RoundRecord[] = [];
  let ct = 0;
  let t = 0;

  for (const row of rows) {
    const data = asRecord(row.data);
    const nextCt = typeof data.ctScore === 'number' ? data.ctScore : null;
    const nextT = typeof data.tScore === 'number' ? data.tScore : null;
    if (nextCt === null || nextT === null) continue;
    if (nextCt === ct && nextT === t) continue;

    const winner = nextCt > ct ? 'CT' : nextT > t ? 'T' : null;
    ct = nextCt;
    t = nextT;
    rounds.push({ round: ct + t, ctScore: ct, tScore: t, winner });
  }

  return rounds;
}
