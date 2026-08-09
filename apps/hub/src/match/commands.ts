import type { ConsoleCommand } from '@ppanel/protocol';

/**
 * Console sequences that drive a match without a server plugin.
 *
 * Everything here is a stock convar. eZ-Match deliberately does not depend on
 * get5 or MatchZy: those are Metamod/CounterStrikeSharp plugins, and those are
 * exactly what break after a CS2 update. A match must still be runnable on a
 * server with no plugins at all.
 *
 * Team 1 is the side that starts as CT, matching `mp_teamname_1`.
 */

export interface MatchSettings {
  team1Name: string;
  team2Name: string;
  map: string;
  maxRounds: number;
  overtimeEnabled: boolean;
  overtimeRounds: number;
  overtimeStartMoney: number;
  /** mp_freezetime seconds for LIVE (Valve competitive default 15). */
  freezetime: number;
  backupPrefix: string;
  /** Applied as sv_password (empty string clears the join password). */
  joinPassword: string;
}

function cmd(command: string, delayMs = 0): ConsoleCommand {
  return { command, delayMs };
}

/** Quotes a value that reaches the server as a single console argument. */
function quoted(value: string): string {
  return `"${value.replace(/["\\;\n\r]/g, '')}"`;
}

const MATCH_CHAT_BRAND = '[EZ-MATCH]';

/**
 * Server chat line for match announcements.
 *
 * With ez_csay installed, console `say` is rewritten as a colored
 * `[EZ-MATCH] …` line. Without it, players still see the plain branded text.
 */
export function matchSay(message: string): string {
  // Strip {color} tags for plain `say` fallback; ez_csay still colors the brand.
  const body = message
    .replace(/["\\;\n\r]/g, '')
    .replace(/\{[a-zA-Z]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!body) return `say ${quoted(MATCH_CHAT_BRAND)}`;
  if (body.toUpperCase().startsWith(MATCH_CHAT_BRAND)) {
    return `say ${quoted(body)}`;
  }
  return `say ${quoted(`${MATCH_CHAT_BRAND} ${body}`)}`;
}

export function sayCommands(message: string): ConsoleCommand[] {
  return [cmd(matchSay(message))];
}

/**
 * Applied once when the match is created. Ends with the map change, so
 * everything after this runs on a freshly loaded map.
 */
export function prepareCommands(settings: MatchSettings): ConsoleCommand[] {
  return [
    cmd('game_type 0'),
    cmd('game_mode 1'),
    cmd('sv_game_mode_flags 0'),
    cmd(`mp_teamname_1 ${quoted(settings.team1Name)}`),
    cmd(`mp_teamname_2 ${quoted(settings.team2Name)}`),
    cmd(`mp_maxrounds ${settings.maxRounds}`),
    cmd(`mp_overtime_enable ${settings.overtimeEnabled ? 1 : 0}`),
    cmd(`mp_overtime_maxrounds ${settings.overtimeRounds}`),
    cmd(`mp_overtime_startmoney ${settings.overtimeStartMoney}`),
    cmd('mp_halftime 1'),
    cmd('mp_match_can_clinch 1'),
    cmd('mp_match_end_restart 0'),
    // Round backups are the whole recovery story: without them a crashed server
    // means replaying the map from the first round.
    cmd('mp_backup_round_auto 1'),
    cmd(`mp_backup_round_file ${quoted(settings.backupPrefix)}`),
    cmd('mp_backup_round_file_pattern "%prefix%_round%round%.txt"'),
    // A warmup that ends on its own would start the match before both teams are
    // in, so the timer is frozen and only eZ-Match ends it.
    cmd('mp_warmup_pausetimer 1'),
    cmd('mp_warmuptime 9999'),
    cmd('mp_do_warmup_period 1'),
    cmd('mp_autoteambalance 0'),
    cmd('mp_limitteams 0'),
    // GOTV only comes up on a map load, so it has to be enabled before the
    // changelevel below or nothing can be recorded for this match.
    cmd('tv_enable 1'),
    cmd('tv_autorecord 0'),
    cmd(`sv_password ${quoted(settings.joinPassword)}`),
    cmd(`changelevel ${settings.map}`, 3000),
  ];
}

/** Re-applied after the map load, because a map change resets most of these. */
export function warmupCommands(settings: MatchSettings): ConsoleCommand[] {
  return [
    cmd(`mp_teamname_1 ${quoted(settings.team1Name)}`),
    cmd(`mp_teamname_2 ${quoted(settings.team2Name)}`),
    cmd(`mp_maxrounds ${settings.maxRounds}`),
    cmd(`mp_overtime_enable ${settings.overtimeEnabled ? 1 : 0}`),
    cmd(`mp_overtime_maxrounds ${settings.overtimeRounds}`),
    cmd(`mp_overtime_startmoney ${settings.overtimeStartMoney}`),
    cmd('mp_autoteambalance 0'),
    cmd('mp_limitteams 0'),
    cmd('mp_warmup_pausetimer 1'),
    cmd('mp_warmuptime 9999'),
    // Minutes — effectively infinite so warmup never ends on round timer.
    cmd('mp_roundtime 60'),
    cmd('mp_roundtime_defuse 60'),
    cmd('mp_warmup_start'),
    cmd('mp_backup_round_auto 1'),
    cmd(`mp_backup_round_file ${quoted(settings.backupPrefix)}`),
    cmd(`sv_password ${quoted(settings.joinPassword)}`),
    cmd(matchSay('Warmup — waiting for teams'), 500),
  ];
}

/**
 * Knife round: melee only, no economy, no bomb. Ends warmup and restarts so the
 * next round is knife-only.
 *
 * Do NOT set `mp_maxrounds 1` — that ends the CS2 match (map vote / session
 * reset). Keep the real maxrounds and pause after the knife round instead.
 */
export function knifeCommands(settings: MatchSettings): ConsoleCommand[] {
  return [
    cmd('mp_give_player_c4 0'),
    cmd('mp_free_armor 0'),
    cmd('mp_ct_default_primary ""'),
    cmd('mp_t_default_primary ""'),
    cmd('mp_ct_default_secondary ""'),
    cmd('mp_t_default_secondary ""'),
    cmd('mp_ct_default_melee weapon_knife'),
    cmd('mp_t_default_melee weapon_knife'),
    cmd('mp_startmoney 0'),
    cmd('mp_maxmoney 0'),
    cmd('mp_buytime 0'),
    cmd('mp_buy_anywhere 0'),
    cmd('mp_death_drop_gun 0'),
    cmd('mp_death_drop_grenade 0'),
    cmd('mp_respawn_immunitytime 0'),
    cmd('mp_roundtime 1.92'),
    cmd('mp_roundtime_defuse 1.92'),
    cmd(`mp_maxrounds ${settings.maxRounds}`),
    cmd('mp_match_end_restart 0'),
    cmd('mp_halftime 1'),
    cmd(matchSay('Knife round — winner picks side with !stay or !switch'), 500),
    cmd('mp_warmup_end', 1000),
    // Re-assert after warmup_end — some map loads reset give_player_c4.
    cmd('mp_give_player_c4 0'),
    cmd('mp_restartgame 1'),
  ];
}

/** Freeze the server after knife so teams can choose stay/switch. */
export function knifeDecisionCommands(winnerName: string): ConsoleCommand[] {
  return [
    cmd('mp_pause_match'),
    cmd(
      matchSay(
        `Knife over — ${winnerName}: type !stay or !switch to choose the starting side`,
      ),
      500,
    ),
  ];
}

/**
 * Warmup after knife side pick: infinite timer/money, free armor+helmet.
 * Teams must !ready again before the official live config starts.
 */
export function postKnifeWarmupCommands(settings: MatchSettings): ConsoleCommand[] {
  return [
    cmd('mp_unpause_match'),
    cmd('mp_give_player_c4 1'),
    // 2 = kevlar + helmet
    cmd('mp_free_armor 2'),
    cmd('mp_ct_default_primary ""'),
    cmd('mp_t_default_primary ""'),
    cmd('mp_ct_default_secondary weapon_hkp2000'),
    cmd('mp_t_default_secondary weapon_glock'),
    cmd('mp_ct_default_melee weapon_knife'),
    cmd('mp_t_default_melee weapon_knife'),
    cmd('mp_startmoney 16000'),
    cmd('mp_maxmoney 16000'),
    cmd('mp_buytime 9999'),
    cmd('mp_buy_anywhere 1'),
    cmd('mp_death_drop_gun 1'),
    cmd('mp_death_drop_grenade 1'),
    // Minutes — effectively infinite so post-knife warmup never ends on timer.
    cmd('mp_roundtime 60'),
    cmd('mp_roundtime_defuse 60'),
    cmd(`mp_maxrounds ${settings.maxRounds}`),
    cmd('mp_halftime 1'),
    cmd('mp_warmup_pausetimer 1'),
    cmd('mp_warmuptime 9999'),
    cmd('mp_do_warmup_period 1'),
    cmd('mp_warmup_start'),
    cmd(
      matchSay('Warmup — both teams type !ready or !r to start the match'),
      500,
    ),
  ];
}

/**
 * Official Valve competitive live config after both teams ready.
 * Undoes warmup-only overrides (infinite roundtime / buytime / buy_anywhere /
 * free armor / startmoney) and restores stock competitive defaults.
 */
export function liveCommands(settings: MatchSettings): ConsoleCommand[] {
  return [
    cmd('mp_give_player_c4 1'),
    cmd('mp_free_armor 0'),
    cmd('mp_ct_default_primary ""'),
    cmd('mp_t_default_primary ""'),
    cmd('mp_ct_default_secondary weapon_hkp2000'),
    cmd('mp_t_default_secondary weapon_glock'),
    cmd('mp_ct_default_melee weapon_knife'),
    cmd('mp_t_default_melee weapon_knife'),
    cmd('mp_startmoney 800'),
    cmd('mp_maxmoney 16000'),
    cmd('mp_buytime 20'),
    cmd('mp_buy_anywhere 0'),
    cmd(`mp_freezetime ${settings.freezetime}`),
    cmd('mp_c4timer 40'),
    cmd('mp_timelimit 0'),
    cmd('mp_death_drop_gun 1'),
    cmd('mp_death_drop_grenade 1'),
    cmd('mp_roundtime 1.92'),
    cmd('mp_roundtime_defuse 1.92'),
    cmd(`mp_maxrounds ${settings.maxRounds}`),
    cmd('mp_halftime 1'),
    cmd('mp_match_can_clinch 1'),
    cmd('mp_autoteambalance 0'),
    cmd('mp_limitteams 0'),
    cmd(`mp_overtime_enable ${settings.overtimeEnabled ? 1 : 0}`),
    cmd(`mp_overtime_maxrounds ${settings.overtimeRounds}`),
    cmd(`mp_overtime_startmoney ${settings.overtimeStartMoney}`),
    cmd('mp_unpause_match'),
    cmd('mp_warmup_end', 1000),
    // Three restarts: the first two clear scores and inventories, the third is
    // what players see as "LIVE". Fewer restarts leaves knife-round money.
    cmd('mp_restartgame 3', 4000),
    cmd(matchSay('LIVE'), 500),
    cmd(matchSay('LIVE'), 700),
    cmd(matchSay('LIVE'), 700),
    cmd(
      matchSay(`${settings.team1Name} vs ${settings.team2Name} — LIVE`),
      900,
    ),
  ];
}

export function swapCommands(): ConsoleCommand[] {
  return [cmd('mp_swapteams', 1000)];
}

/**
 * GOTV has to be running before it can record, and enabling it needs a map
 * change to take effect — so `tv_enable` is issued during prepare and only the
 * recording itself starts here.
 */
export function startRecordingCommands(demoName: string): ConsoleCommand[] {
  return [cmd('tv_stoprecord'), cmd(`tv_record ${quoted(demoName)}`, 500)];
}

export function stopRecordingCommands(): ConsoleCommand[] {
  return [cmd('tv_stoprecord')];
}

export function pauseCommands(): ConsoleCommand[] {
  return [cmd('mp_pause_match')];
}

export function unpauseCommands(): ConsoleCommand[] {
  return [cmd('mp_unpause_match')];
}

export function listBackupsCommands(): ConsoleCommand[] {
  return [cmd('mp_backup_restore_list_files')];
}

export function restoreCommands(file: string): ConsoleCommand[] {
  return [
    cmd(`mp_backup_restore_load_file ${quoted(file)}`, 500),
    cmd('mp_pause_match'),
  ];
}

export function endCommands(): ConsoleCommand[] {
  return [
    cmd('mp_backup_round_auto 0'),
    cmd('mp_warmup_pausetimer 0'),
    cmd('mp_maxrounds 24'),
    cmd('mp_warmup_start'),
  ];
}

/** Parses the reply to `mp_backup_restore_list_files`. */
export function parseBackupList(lines: string[]): string[] {
  const files: string[] = [];
  for (const line of lines) {
    const match = /([A-Za-z0-9_.-]*round\d+\.txt)/i.exec(line);
    if (match?.[1] && !files.includes(match[1])) files.push(match[1]);
  }
  return files;
}
