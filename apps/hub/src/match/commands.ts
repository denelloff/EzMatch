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
    cmd('mp_warmup_start'),
    cmd('mp_backup_round_auto 1'),
    cmd(`mp_backup_round_file ${quoted(settings.backupPrefix)}`),
    cmd(`sv_password ${quoted(settings.joinPassword)}`),
  ];
}

/**
 * Knife round: melee only, no economy, no bomb. Ends warmup and restarts, so
 * the first live round after this is the knife round itself.
 */
export function knifeCommands(): ConsoleCommand[] {
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
    cmd('mp_maxrounds 1'),
    cmd('mp_warmup_end', 1000),
    cmd('mp_restartgame 1'),
  ];
}

/** Undoes the knife settings and starts the real match. */
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
    cmd('mp_death_drop_gun 1'),
    cmd('mp_death_drop_grenade 1'),
    cmd('mp_roundtime 1.92'),
    cmd('mp_roundtime_defuse 1.92'),
    cmd(`mp_maxrounds ${settings.maxRounds}`),
    cmd('mp_halftime 1'),
    cmd(`mp_overtime_enable ${settings.overtimeEnabled ? 1 : 0}`),
    cmd(`mp_overtime_maxrounds ${settings.overtimeRounds}`),
    cmd(`mp_overtime_startmoney ${settings.overtimeStartMoney}`),
    cmd('mp_unpause_match'),
    cmd('mp_warmup_end', 1000),
    // Three restarts: the first two clear scores and inventories, the third is
    // what players see as "LIVE". Fewer restarts leaves knife-round money.
    cmd('mp_restartgame 3', 4000),
    cmd(`say ${quoted(`${settings.team1Name} vs ${settings.team2Name} — LIVE`)}`),
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

export function sayCommands(message: string): ConsoleCommand[] {
  return [cmd(`say ${quoted(message)}`)];
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
