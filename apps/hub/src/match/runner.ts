import { decryptSecret, loadMasterKey, type MatchState } from '@ppanel/db';
import { demoNameFor, type ConsoleCommand, type DemoFile, type GameEvent } from '@ppanel/protocol';
import { agents } from '../agent/registry.js';
import { ingest } from '../agent/ingest.js';
import { bus } from '../bus.js';
import { db } from '../db.js';
import { logger } from '../logger.js';
import {
  endCommands,
  knifeCommands,
  knifeDecisionCommands,
  liveCommands,
  listBackupsCommands,
  parseBackupList,
  pauseCommands,
  postKnifeWarmupCommands,
  prepareCommands,
  restoreCommands,
  sayCommands,
  startRecordingCommands,
  stopRecordingCommands,
  swapCommands,
  unpauseCommands,
  warmupCommands,
  type MatchSettings,
} from './commands.js';
import { sideFromTeamNumber } from './console-events.js';

/**
 * How long to wait for the log line that proves a transition happened. On
 * expiry the match stays where it was and says why, instead of pretending the
 * server did something it did not: a match that silently believes it is live
 * while the server is in warmup is worse than one that reports it is stuck.
 *
 * Map changes are slow on first load / workshop maps, so this budget is
 * deliberately longer than a round restart.
 */
const CONFIRM_TIMEOUT_MS = 90_000;

/** Warmup nag: remind players that casters have not unlocked !ready yet. */
const STREAMERS_NAG_MS = 30_000;

/** Warmup nag: remind players to type !ready / !r (after streamers are ready). */
const READY_NAG_MS = 22_500;

const READY_NAG_MESSAGE =
  'To start the game type !ready or !r in chat';

interface Pending {
  toState: MatchState;
  reason: string;
  accepts: (event: GameEvent) => boolean;
  onCommit?: () => Promise<void>;
  timer: NodeJS.Timeout;
  resolve: () => void;
  reject: (error: Error) => void;
  /** Optional console unsubscribe for map-load fallback. */
  unsubscribeConsole?: () => void;
  /** Soft confirm if the map log never shows up after changelevel. */
  fallbackTimer?: NodeJS.Timeout;
}

function mapNameMatches(reported: string, wanted: string): boolean {
  const a = reported.toLowerCase().replace(/^workshop\/\d+\//, '');
  const b = wanted.toLowerCase();
  return !a || a === b || a.includes(b) || b.includes(a);
}

/** Pull a map name out of a raw console line when game-events missed it. */
function mapFromConsoleLine(line: string): string | null {
  const match =
    /(?:Loading map|Started map)\s+"([^"]+)"/i.exec(line) ??
    /Changed map to\s+"?([^"\s]+)"?/i.exec(line);
  return match?.[1] ?? null;
}

export class MatchError extends Error {}

type MatchRow = Awaited<ReturnType<typeof loadMatch>>;

async function loadMatch(matchId: string) {
  const match = await db().match.findUnique({
    where: { id: matchId },
    include: { instance: { select: { id: true, serverId: true, state: true } } },
  });
  if (!match) throw new MatchError('Match not found');
  return match;
}

function settingsOf(match: NonNullable<MatchRow>): MatchSettings {
  return {
    team1Name: match.team1Name,
    team2Name: match.team2Name,
    map: match.map,
    maxRounds: match.maxRounds,
    overtimeEnabled: match.overtimeEnabled,
    overtimeRounds: match.overtimeRounds,
    overtimeStartMoney: match.overtimeStartMoney,
    backupPrefix: match.backupPrefix,
    joinPassword: match.joinPasswordEnc
      ? decryptSecret(match.joinPasswordEnc, loadMasterKey())
      : '',
  };
}

/** Stable key for MatchPlayer when SteamID64 is missing (bots / early connect). */
function playerIdentity(player: {
  steamId: string | null;
  userId: number | null;
  name: string;
}): string | null {
  if (player.steamId && player.steamId !== 'BOT') {
    if (/^\[U:1:\d+\]$/i.test(player.steamId)) {
      const account = /^\[U:1:(\d+)\]$/i.exec(player.steamId)?.[1];
      if (account) {
        return String(BigInt('76561197960265728') + BigInt(account));
      }
    }
    return player.steamId;
  }
  return null;
}

class MatchRunner {
  private readonly pending = new Map<string, Pending>();
  /** Warmup intervals that spam "Streamers are not ready" every 30s. */
  private readonly streamerNags = new Map<string, NodeJS.Timeout>();
  /** Warmup intervals that remind players to !ready after streamers unlock. */
  private readonly readyNags = new Map<string, NodeJS.Timeout>();
  /** Last knife-round winning side seen in logs before round_end. */
  private readonly knifeWinningSide = new Map<string, 'CT' | 'TERRORIST'>();

  attach(): void {
    ingest.onGameEvents((instanceId, events) => {
      void this.onEvents(instanceId, events).catch((error: unknown) => {
        logger.error({ instanceId, error }, 'match event handling failed');
      });
    });
  }

  /**
   * After a hub restart the in-memory link from instance to match is gone,
   * while the game keeps playing. Rebuilding it from the database is what makes
   * a hub restart mid-match survivable.
   */
  async resume(): Promise<void> {
    const live = await db().match.findMany({
      where: { state: { notIn: ['FINISHED', 'CANCELLED', 'DRAFT'] } },
      select: {
        id: true,
        instanceId: true,
        state: true,
        streamersReady: true,
      },
    });
    for (const match of live) {
      ingest.setActiveMatch(match.instanceId, match.id);
      if (match.state !== 'WARMUP') continue;
      if (!match.streamersReady) {
        this.startStreamerNag(match.id);
      } else {
        this.startReadyNag(match.id);
      }
    }
    if (live.length > 0) {
      logger.info({ count: live.length }, 'resumed matches in progress');
    }
  }

  /** Re-point CS2 HTTP logs at the agent after reconnect / hub restart. */
  async reapplyLogSinks(serverId: string): Promise<void> {
    const live = await db().match.findMany({
      where: {
        state: { notIn: ['FINISHED', 'CANCELLED', 'DRAFT'] },
        instance: { serverId, state: 'RUNNING' },
      },
      select: { id: true, instanceId: true },
    });
    for (const match of live) {
      try {
        await this.applyLogSink(match.instanceId, serverId);
      } catch (error: unknown) {
        logger.warn(
          { matchId: match.id, error },
          'could not re-apply log sink after agent connect',
        );
      }
    }
  }

  // ---------------------------------------------------------------- commands

  async prepare(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'DRAFT') {
      throw new MatchError('This match has already been started');
    }
    if (match.instance.state !== 'RUNNING') {
      throw new MatchError('The CS2 server is not running');
    }

    const other = await db().match.findFirst({
      where: {
        instanceId: match.instanceId,
        id: { not: match.id },
        state: { notIn: ['FINISHED', 'CANCELLED', 'DRAFT'] },
      },
    });
    if (other) {
      throw new MatchError(
        `"${other.title}" is still running on this server. Finish or cancel it first.`,
      );
    }

    ingest.setActiveMatch(match.instanceId, match.id);

    await db().match.update({
      where: { id: matchId },
      data: { lastError: null, streamersReady: false },
    });

    await this.applyLogSink(match.instanceId, match.instance.serverId).catch(
      (error: unknown) => {
        logger.warn({ matchId, error }, 'could not apply log sink before prepare');
      },
    );

    // Map load confirmation: CS2 often only prints "Loading map" (map_loading),
    // not always "Started map" / "Changed map". Accept any of them. Console
    // fallback below covers bare Docker lines the agent may not have eventified.
    await this.sendExpecting(match, prepareCommands(settingsOf(match)), {
      toState: 'WARMUP',
      reason: 'map loaded',
      accepts: (event) => {
        if (
          event.kind !== 'map_started' &&
          event.kind !== 'map_changed' &&
          event.kind !== 'map_loading'
        ) {
          return false;
        }
        return mapNameMatches(String(event.data.map ?? ''), match.map);
      },
      onCommit: async () => {
        const fresh = await loadMatch(matchId);
        // Map change can drop the HTTP log receiver registration.
        await this.applyLogSink(fresh.instanceId, fresh.instance.serverId).catch(
          (error: unknown) => {
            logger.warn({ matchId, error }, 'could not re-apply log sink after map load');
          },
        );
        await this.send(fresh, warmupCommands(settingsOf(fresh)));
        this.startStreamerNag(matchId);
      },
    });
  }

  /** Casters confirmed — players may type !ready on the server. */
  async markStreamersReady(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'WARMUP') {
      throw new MatchError('Streamers ready is only used during warmup');
    }
    if (match.streamersReady) return;

    this.stopStreamerNag(matchId);
    await db().match.update({
      where: { id: matchId },
      data: { streamersReady: true },
    });
    await this.send(
      match,
      sayCommands(
        'Streamers are ready. Players may type !ready when you are ready.',
      ),
    );
    this.publish(matchId, { streamersReady: true });
    this.startReadyNag(matchId);
  }

  async startKnife(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'WARMUP') {
      throw new MatchError('The knife round starts from warmup');
    }
    if (!match.knifeRound) {
      await this.goLive(matchId);
      return;
    }

    this.stopStreamerNag(matchId);
    this.stopReadyNag(matchId);
    this.knifeWinningSide.delete(matchId);
    await this.sendExpecting(match, knifeCommands(settingsOf(match)), {
      toState: 'KNIFE',
      reason: 'knife round started',
      accepts: (event) => event.kind === 'round_start',
    });
  }

  async decideKnife(matchId: string, choice: 'stay' | 'swap'): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'KNIFE_DECISION') {
      throw new MatchError('There is no knife decision to make');
    }

    if (choice === 'swap') {
      await this.send(match, swapCommands());
      await db().match.update({
        where: { id: matchId },
        data: { team1Side: match.team1Side === 'CT' ? 'TERRORIST' : 'CT' },
      });
      this.publish(matchId, {
        team1Side: match.team1Side === 'CT' ? 'TERRORIST' : 'CT',
      });
      await this.send(match, sayCommands('Sides swapped — back to warmup'));
    } else {
      await this.send(match, sayCommands('Sides stay — back to warmup'));
    }

    this.knifeWinningSide.delete(matchId);

    // Both teams must !ready again before official live config.
    await db().matchPlayer.updateMany({
      where: { matchId },
      data: { ready: false },
    });

    await this.send(match, postKnifeWarmupCommands(settingsOf(match)));
    await this.transition(
      matchId,
      'KNIFE_DECISION',
      'WARMUP',
      `knife: ${choice}`,
      false,
    );
    this.publish(matchId, { players: true });
    this.startReadyNag(matchId);
  }

  async goLive(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    this.stopStreamerNag(matchId);
    this.stopReadyNag(matchId);

    await this.sendExpecting(match, liveCommands(settingsOf(match)), {
      toState: 'LIVE',
      reason: 'first live round started',
      accepts: (event) => event.kind === 'round_start',
      onCommit: async () => {
        const demoName = match.demoName ?? demoNameFor(match.id, match.map);
        await db().match.update({
          where: { id: matchId },
          data: {
            startedAt: match.startedAt ?? new Date(),
            team1Score: 0,
            team2Score: 0,
            demoName,
          },
        });

        // A server without GOTV still plays a perfectly valid match, so a
        // failed recording must not take the match down with it.
        await this.send(match, startRecordingCommands(demoName)).catch((error) => {
          logger.warn(
            { matchId, err: error },
            'could not start the GOTV recording',
          );
        });
      },
    });
  }

  async pause(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'LIVE' && match.state !== 'OVERTIME') {
      throw new MatchError('Only a live match can be paused');
    }
    await this.send(match, pauseCommands());
    // The pause takes effect at the end of the current round, but the intent is
    // recorded now so the UI does not look unresponsive for two minutes.
    await this.transition(matchId, match.state, 'PAUSED', 'paused by an operator', false);
  }

  async unpause(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'PAUSED') throw new MatchError('The match is not paused');
    await this.send(match, unpauseCommands());
    await this.transition(matchId, 'PAUSED', 'LIVE', 'resumed by an operator', false);
  }

  async listBackups(matchId: string): Promise<string[]> {
    const match = await loadMatch(matchId);
    const result = (await this.send(match, listBackupsCommands(), 2500)) as {
      output?: string[];
    } | null;
    const files = parseBackupList(result?.output ?? []);
    // Only this match's own backups: loading another match's round file would
    // silently restore the wrong score.
    return files.filter((file) => file.startsWith(match.backupPrefix));
  }

  async restore(matchId: string, file: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (!file.startsWith(match.backupPrefix) || !/^[A-Za-z0-9_.-]+$/.test(file)) {
      throw new MatchError('That backup does not belong to this match');
    }
    if (match.state === 'DRAFT' || match.state === 'FINISHED' || match.state === 'CANCELLED') {
      throw new MatchError('This match is not in progress');
    }

    await this.send(match, restoreCommands(file));
    await this.transition(
      matchId,
      match.state,
      'PAUSED',
      `restored from ${file}`,
      false,
    );
  }

  async cancel(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state === 'FINISHED' || match.state === 'CANCELLED') return;

    this.stopStreamerNag(matchId);
    this.stopReadyNag(matchId);
    this.knifeWinningSide.delete(matchId);
    this.clearPending(matchId);
    await this.send(match, stopRecordingCommands()).catch(() => undefined);
    await this.send(match, endCommands()).catch(() => undefined);
    ingest.setActiveMatch(match.instanceId, null);
    await this.transition(matchId, match.state, 'CANCELLED', 'cancelled by an operator', true);
    await this.syncDemos(matchId).catch(() => undefined);
  }

  /**
   * Puts a stuck / warmup match back to DRAFT and runs prepare again so the
   * operator can re-apply convars and changelevel without creating a duplicate.
   */
  async restart(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state === 'FINISHED' || match.state === 'CANCELLED') {
      throw new MatchError('Finished matches cannot be restarted');
    }
    if (
      match.state !== 'DRAFT' &&
      match.state !== 'WARMUP' &&
      match.state !== 'KNIFE' &&
      match.state !== 'KNIFE_DECISION'
    ) {
      throw new MatchError('Restart is only available before the match goes live');
    }

    this.clearPending(matchId);
    this.stopStreamerNag(matchId);
    this.stopReadyNag(matchId);
    this.knifeWinningSide.delete(matchId);
    if (match.state !== 'DRAFT') {
      await this.send(match, endCommands()).catch(() => undefined);
      ingest.setActiveMatch(match.instanceId, null);
      await db().match.update({
        where: { id: matchId },
        data: {
          team1Score: 0,
          team2Score: 0,
          knifeWinner: null,
          lastError: null,
          startedAt: null,
          demoName: null,
          team1Side: 'CT',
          streamersReady: false,
        },
      });
      await db().matchPlayer.updateMany({
        where: { matchId },
        data: { ready: false, connected: false },
      });
      await this.transition(matchId, match.state, 'DRAFT', 'restarted by an operator', false);
    } else {
      await db().match.update({
        where: { id: matchId },
        data: { lastError: null },
      });
    }

    await this.prepare(matchId);
  }

  /**
   * Indexes the GOTV files the instance holds and keeps the ones this match
   * recorded. The demo itself stays on the game host — only its name, size and
   * timestamp are stored, so the index can always be rebuilt from the volume.
   */
  async syncDemos(matchId: string): Promise<number> {
    const match = await loadMatch(matchId);
    if (!match.demoName) return 0;

    const result = (await agents.dispatch(match.instance.serverId, {
      type: 'demo.list',
      instanceId: match.instanceId,
    })) as { files?: DemoFile[] } | null;

    const own = (result?.files ?? []).filter((file) =>
      file.name.startsWith(match.demoName!),
    );

    for (const file of own) {
      await db().matchDemo.upsert({
        where: { matchId_fileName: { matchId, fileName: file.name } },
        create: {
          matchId,
          fileName: file.name,
          sizeBytes: BigInt(file.sizeBytes),
          recordedAt: new Date(file.modifiedAt),
        },
        update: {
          sizeBytes: BigInt(file.sizeBytes),
          recordedAt: new Date(file.modifiedAt),
        },
      });
    }

    return own.length;
  }

  // ------------------------------------------------------------------ events

  private async onEvents(instanceId: string, events: GameEvent[]): Promise<void> {
    const matchId = ingest.getActiveMatch(instanceId);
    if (!matchId) return;

    for (const event of events) {
      const pending = this.pending.get(matchId);
      if (pending?.accepts(event)) {
        await this.fulfillPending(matchId, pending);
      }

      await this.applyEvent(matchId, event);
    }
  }

  private async fulfillPending(
    matchId: string,
    pending: Pending,
  ): Promise<void> {
    this.clearPending(matchId);
    const match = await loadMatch(matchId);
    await this.transition(
      matchId,
      match.state,
      pending.toState,
      pending.reason,
      false,
    );
    try {
      await pending.onCommit?.();
      pending.resolve();
    } catch (error) {
      pending.reject(
        error instanceof Error ? error : new MatchError(String(error)),
      );
      throw error;
    }
  }

  private async applyEvent(matchId: string, event: GameEvent): Promise<void> {
    switch (event.kind) {
      case 'match_status':
        await this.applyScore(matchId, event);
        break;

      case 'round_end':
        await this.onRoundEnd(matchId, event);
        break;

      case 'team_notice':
        await this.onTeamNotice(matchId, event);
        break;

      case 'game_over':
        await this.onGameOver(matchId, event);
        break;

      case 'player_kill':
        await this.applyKill(matchId, event);
        break;

      case 'player_assist':
        await this.bumpPlayer(matchId, event.actor, { assists: 1 });
        break;

      case 'player_attack':
        await this.bumpPlayer(matchId, event.actor, {
          damage: Number(event.data.damage ?? event.data.damageHealth ?? 0) || 0,
        });
        break;

      case 'player_entered':
      case 'player_connect':
      case 'player_validated':
        await this.setConnected(matchId, event, true);
        break;

      case 'player_disconnect':
        await this.setConnected(matchId, event, false);
        break;

      case 'player_switched_team':
        await this.setConnected(matchId, event, true);
        break;

      case 'player_say':
        await this.onPlayerSay(matchId, event);
        break;

      default:
        break;
    }
  }

  private async onPlayerSay(matchId: string, event: GameEvent): Promise<void> {
    const raw = String(
      event.data.text ?? event.data.message ?? event.data.msg ?? '',
    ).trim();
    if (!raw) return;

    const command = raw.replace(/^[.!\/]/, '').trim().toLowerCase();
    const match = await loadMatch(matchId);

    if (match.state === 'KNIFE_DECISION') {
      const stay = command === 'stay';
      const swap = command === 'switch' || command === 'swap';
      if (!stay && !swap) return;
      await this.onKnifeChatChoice(matchId, event, stay ? 'stay' : 'swap');
      return;
    }

    const readyUp = command === 'ready' || command === 'r';
    const readyDown = command === 'unready' || command === 'notready';
    if (!readyUp && !readyDown) return;

    if (match.state !== 'WARMUP') return;

    if (!match.streamersReady) {
      await this.send(match, sayCommands('Streamers are not ready'));
      return;
    }

    await this.setConnected(matchId, event, true);

    const player = event.actor;
    if (!player) return;
    const steamId = playerIdentity(player);
    if (!steamId) return;

    await db().matchPlayer.update({
      where: { matchId_steamId: { matchId, steamId } },
      data: { ready: readyUp },
    });

    const name = player.name || 'Player';
    await this.send(
      match,
      sayCommands(readyUp ? `${name} is ready` : `${name} is not ready`),
    );
    this.publish(matchId, { players: true });

    if (readyUp) {
      await this.maybeAutoGoLive(matchId);
    }
  }

  /**
   * After streamers unlock !ready: when every connected team1/team2 player is
   * ready (and each side has at least one), start the official match.
   * Pre-knife warmup still waits for the panel/command knife start.
   */
  private async maybeAutoGoLive(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'WARMUP' || !match.streamersReady) return;
    // Knife still started from the panel until a winner has picked sides.
    if (match.knifeRound && !match.knifeWinner) return;

    const players = await db().matchPlayer.findMany({
      where: { matchId, connected: true, team: { in: [1, 2] } },
      select: { team: true, ready: true },
    });
    const team1 = players.filter((row) => row.team === 1);
    const team2 = players.filter((row) => row.team === 2);
    if (team1.length === 0 || team2.length === 0) return;
    if (!team1.every((row) => row.ready) || !team2.every((row) => row.ready)) {
      return;
    }

    await this.send(match, sayCommands('Both teams are ready — going live'));
    await this.goLive(matchId);
  }

  private async onKnifeChatChoice(
    matchId: string,
    event: GameEvent,
    choice: 'stay' | 'swap',
  ): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'KNIFE_DECISION') return;

    const player = event.actor;
    if (!player) return;

    const steamId = playerIdentity(player);
    let team = this.teamOf(match.team1Side, player.side);
    if ((!team || team === 0) && steamId) {
      const row = await db().matchPlayer.findUnique({
        where: { matchId_steamId: { matchId, steamId } },
        select: { team: true },
      });
      team = row?.team ?? 0;
    }
    if (!match.knifeWinner || team !== match.knifeWinner) {
      await this.send(
        match,
        sayCommands('Only the knife-round winners may choose !stay or !switch'),
      );
      return;
    }

    await this.decideKnife(matchId, choice);
  }

  /**
   * `MatchStatus: Score: a:b ... RoundsPlayed: n` is the server's own view of
   * the score, so it is trusted over anything counted from round results.
   */
  private async applyScore(matchId: string, event: GameEvent): Promise<void> {
    const ctScore = Number(event.data.ctScore);
    const tScore = Number(event.data.tScore);
    const roundsPlayed = Number(event.data.roundsPlayed);
    if (!Number.isFinite(ctScore) || !Number.isFinite(tScore)) return;

    const match = await loadMatch(matchId);
    if (match.state === 'KNIFE' || match.state === 'KNIFE_DECISION') return;
    if (match.state === 'DRAFT' || match.state === 'WARMUP') return;

    const team1Score = match.team1Side === 'CT' ? ctScore : tScore;
    const team2Score = match.team1Side === 'CT' ? tScore : ctScore;
    if (team1Score === match.team1Score && team2Score === match.team2Score) return;

    await db().match.update({
      where: { id: matchId },
      data: { team1Score, team2Score },
    });

    this.publish(matchId, { team1Score, team2Score, roundsPlayed });

    const half = Math.floor(match.maxRounds / 2);
    const played = Number.isFinite(roundsPlayed) ? roundsPlayed : team1Score + team2Score;

    // CS2 swaps the sides itself at halftime; PPanel only has to follow, or the
    // score would land on the wrong team for the whole second half.
    if (played === half && match.state === 'LIVE') {
      await db().match.update({
        where: { id: matchId },
        data: { team1Side: match.team1Side === 'CT' ? 'TERRORIST' : 'CT' },
      });
      await this.transition(matchId, 'LIVE', 'HALFTIME', 'half time', false);
    } else if (played > half && match.state === 'HALFTIME') {
      await this.transition(matchId, 'HALFTIME', 'LIVE', 'second half started', false);
    } else if (
      match.overtimeEnabled &&
      played >= match.maxRounds &&
      team1Score === team2Score &&
      match.state === 'LIVE'
    ) {
      await this.transition(matchId, 'LIVE', 'OVERTIME', 'tied after regulation', false);
    }
  }

  private async onTeamNotice(matchId: string, event: GameEvent): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'KNIFE') return;

    const winner = winnerSideFromEvent(event);
    if (!winner) return;
    this.knifeWinningSide.set(matchId, winner);
  }

  private async onRoundEnd(matchId: string, event: GameEvent): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'KNIFE') return;

    const winnerSide =
      winnerSideFromEvent(event) ?? this.knifeWinningSide.get(matchId) ?? null;
    const knifeWinner = winnerSide
      ? this.teamOf(match.team1Side, winnerSide)
      : null;

    await db().match.update({
      where: { id: matchId },
      data: { knifeWinner: knifeWinner || null },
    });

    const winnerName =
      knifeWinner === 1
        ? match.team1Name
        : knifeWinner === 2
          ? match.team2Name
          : 'Knife winners';

    // Pause before the next freeze-time round starts so the match does not
    // continue with knife loadouts (and never hits game-over from maxrounds 1).
    await this.send(match, knifeDecisionCommands(winnerName)).catch(
      (error: unknown) => {
        logger.warn({ matchId, error }, 'could not pause after knife round');
      },
    );

    await this.transition(
      matchId,
      'KNIFE',
      'KNIFE_DECISION',
      'knife round finished',
      false,
    );
    this.publish(matchId, { knifeWinner: knifeWinner || null });
  }

  private async onGameOver(matchId: string, event: GameEvent): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state === 'FINISHED' || match.state === 'CANCELLED') return;

    // With the old mp_maxrounds 1 knife, CS2 fired game_over here and reset the
    // session. Treat that as a knife decision instead of finishing the match.
    if (match.state === 'KNIFE') {
      await this.onRoundEnd(matchId, event);
      return;
    }
    if (match.state === 'KNIFE_DECISION') return;

    const ctScore = Number(event.data.ctScore);
    const tScore = Number(event.data.tScore);
    const data: { team1Score?: number; team2Score?: number } = {};
    if (Number.isFinite(ctScore) && Number.isFinite(tScore)) {
      data.team1Score = match.team1Side === 'CT' ? ctScore : tScore;
      data.team2Score = match.team1Side === 'CT' ? tScore : ctScore;
    }

    await db().match.update({
      where: { id: matchId },
      data: { ...data, endedAt: new Date() },
    });

    this.clearPending(matchId);
    this.stopStreamerNag(matchId);
    this.stopReadyNag(matchId);
    this.knifeWinningSide.delete(matchId);
    ingest.setActiveMatch(match.instanceId, null);
    await this.transition(matchId, match.state, 'FINISHED', 'game over', true);
    await this.send(match, stopRecordingCommands()).catch(() => undefined);
    await this.send(match, endCommands()).catch(() => undefined);
    // GOTV flushes on stop, so the size is only final once the file is closed.
    await this.syncDemos(matchId).catch(() => undefined);
  }

  private async applyKill(matchId: string, event: GameEvent): Promise<void> {
    if (event.actor && event.target && event.actor.steamId !== event.target.steamId) {
      await this.bumpPlayer(matchId, event.actor, { kills: 1 });
    }
    await this.bumpPlayer(matchId, event.target, { deaths: 1 });
  }

  private async bumpPlayer(
    matchId: string,
    player: GameEvent['actor'],
    delta: { kills?: number; deaths?: number; assists?: number; damage?: number },
  ): Promise<void> {
    if (!player) return;
    const steamId = playerIdentity(player);
    if (!steamId) return;
    const match = await loadMatch(matchId);
    if (match.state !== 'LIVE' && match.state !== 'OVERTIME') return;

    await db().matchPlayer.upsert({
      where: { matchId_steamId: { matchId, steamId } },
      create: {
        matchId,
        steamId,
        name: player.name,
        team: this.teamOf(match.team1Side, player.side),
        kills: delta.kills ?? 0,
        deaths: delta.deaths ?? 0,
        assists: delta.assists ?? 0,
        damage: delta.damage ?? 0,
        connected: true,
      },
      update: {
        name: player.name,
        team: this.teamOf(match.team1Side, player.side),
        ...(delta.kills ? { kills: { increment: delta.kills } } : {}),
        ...(delta.deaths ? { deaths: { increment: delta.deaths } } : {}),
        ...(delta.assists ? { assists: { increment: delta.assists } } : {}),
        ...(delta.damage ? { damage: { increment: delta.damage } } : {}),
      },
    });
  }

  private async setConnected(
    matchId: string,
    event: GameEvent,
    connected: boolean,
  ): Promise<void> {
    const player = event.actor;
    if (!player) return;

    const match = await loadMatch(matchId);
    if (
      match.state === 'FINISHED' ||
      match.state === 'CANCELLED' ||
      match.state === 'DRAFT'
    ) {
      return;
    }

    // Prefer side from the event; switched_team often puts the new team in data.
    const side =
      player.side ??
      sideFromTeamNumber(event.data.toTeam) ??
      (typeof event.data.to === 'string'
        ? event.data.to
        : typeof event.data.newTeam === 'string'
          ? event.data.newTeam
          : typeof event.data.team === 'string'
            ? event.data.team
            : null);

    // Name-only disconnects (Docker console) — mark every row with that name.
    if (!connected && !player.steamId && player.name) {
      const players = await db().matchPlayer.findMany({
        where: { matchId, connected: true },
        select: { id: true, name: true },
      });
      const needle = player.name.trim().toLowerCase();
      const ids = players
        .filter((row) => row.name.trim().toLowerCase() === needle)
        .map((row) => row.id);
      if (ids.length === 0) return;
      await db().matchPlayer.updateMany({
        where: { id: { in: ids } },
        data: { connected: false, ready: false },
      });
      this.publish(matchId, { players: true });
      return;
    }

    const steamId = playerIdentity(player);
    if (!steamId) return;

    await db().matchPlayer.upsert({
      where: { matchId_steamId: { matchId, steamId } },
      create: {
        matchId,
        steamId,
        name: player.name,
        team: this.teamOf(match.team1Side, side),
        connected,
      },
      update: {
        name: player.name,
        connected,
        ...(side ? { team: this.teamOf(match.team1Side, side) } : {}),
        ...(!connected ? { ready: false } : {}),
      },
    });

    // Scoreboard only reloads on match SSE ticks — tell it players changed.
    this.publish(matchId, { players: true });
  }

  private teamOf(team1Side: string, side: string | null): number {
    if (!side) return 0;
    const normalized =
      side === 'T' || side === 'Terrorist' || side === 'terrorist'
        ? 'TERRORIST'
        : side === 'Counter-Terrorist' || side === 'ct'
          ? 'CT'
          : side;
    if (normalized !== 'CT' && normalized !== 'TERRORIST') return 0;
    return normalized === team1Side ? 1 : 2;
  }

  private async applyLogSink(instanceId: string, serverId: string): Promise<void> {
    await agents.dispatch(serverId, {
      type: 'logsink.apply',
      instanceId,
      logDetail: 3,
      logItems: false,
    });
  }

  // ------------------------------------------------------------------ helpers

  private async send(
    match: NonNullable<MatchRow>,
    commands: ConsoleCommand[],
    captureMs = 0,
  ): Promise<unknown> {
    return agents.dispatch(match.instance.serverId, {
      type: 'console.send',
      instanceId: match.instanceId,
      commands,
      captureMs,
    });
  }

  /**
   * The expectation is registered before the commands go out. Some of these
   * sequences end with a deliberate delay, and the log event that confirms them
   * can land while the agent is still working through the batch; registering
   * afterwards would miss it and leave the match stuck until the timeout.
   *
   * Resolves only after the expected log event (or rejects on timeout), so the
   * panel Start button does not claim success while the match is still DRAFT.
   */
  private async sendExpecting(
    match: NonNullable<MatchRow>,
    commands: ConsoleCommand[],
    expectation: Omit<
      Pending,
      'timer' | 'resolve' | 'reject' | 'unsubscribeConsole' | 'fallbackTimer'
    >,
  ): Promise<void> {
    const confirmed = new Promise<void>((resolve, reject) => {
      this.expect(match, { ...expectation, resolve, reject });
    });
    try {
      await this.send(match, commands);
    } catch (error) {
      const pending = this.pending.get(match.id);
      this.clearPending(match.id);
      pending?.reject(
        error instanceof Error ? error : new MatchError(String(error)),
      );
      throw error;
    }

    // changelevel is the last prepare command (with its own delay). If CS2 is
    // already on that map, or Docker never echoes "Loading map", still move on
    // so the operator is not stuck in DRAFT forever.
    if (expectation.toState === 'WARMUP') {
      const pending = this.pending.get(match.id);
      if (pending) {
        pending.fallbackTimer = setTimeout(() => {
          const current = this.pending.get(match.id);
          if (!current || current.toState !== 'WARMUP') return;
          logger.warn(
            { matchId: match.id, map: match.map },
            'prepare: confirming WARMUP without map log line',
          );
          void this.fulfillPending(match.id, current).catch((error: unknown) => {
            logger.error({ matchId: match.id, error }, 'prepare fallback failed');
          });
        }, 10_000);
        pending.fallbackTimer.unref?.();
      }
    }

    await confirmed;
  }

  private expect(
    match: NonNullable<MatchRow>,
    input: Omit<Pending, 'timer' | 'unsubscribeConsole' | 'fallbackTimer'>,
  ): void {
    const previous = this.pending.get(match.id);
    if (previous) {
      previous.unsubscribeConsole?.();
      if (previous.fallbackTimer) clearTimeout(previous.fallbackTimer);
      clearTimeout(previous.timer);
      this.pending.delete(match.id);
      previous.reject(new MatchError('Match action superseded'));
    }

    // Docker console often prints bare "Loading map" lines that never become
    // game events (agent drops lines without an L-timestamp). Watch the live
    // console topic so prepare can still confirm.
    let unsubscribeConsole: (() => void) | undefined;
    if (input.toState === 'WARMUP' && input.reason === 'map loaded') {
      unsubscribeConsole = bus.subscribe(
        `console:${match.instanceId}`,
        (data) => {
          const line = String(
            data && typeof data === 'object' && 'line' in data
              ? (data as { line: unknown }).line
              : '',
          );
          const reported = mapFromConsoleLine(line);
          if (!reported || !mapNameMatches(reported, match.map)) return;
          const pending = this.pending.get(match.id);
          if (!pending) return;
          void this.fulfillPending(match.id, pending).catch((error: unknown) => {
            logger.error({ matchId: match.id, error }, 'console map confirm failed');
          });
        },
      );
    }

    const timer = setTimeout(() => {
      const pending = this.pending.get(match.id);
      this.clearPending(match.id);
      const message = `The server did not report "${input.reason}" within ${
        CONFIRM_TIMEOUT_MS / 1000
      }s. The match is still ${match.state.toLowerCase()}.`;
      logger.warn({ matchId: match.id, expected: input.toState }, 'transition not confirmed');
      void db()
        .match.update({ where: { id: match.id }, data: { lastError: message } })
        .catch(() => undefined);
      this.publish(match.id, { error: message });
      pending?.reject(new MatchError(message));
    }, CONFIRM_TIMEOUT_MS);
    timer.unref?.();

    this.pending.set(match.id, { ...input, timer, unsubscribeConsole });
  }

  private clearPending(matchId: string): void {
    const pending = this.pending.get(matchId);
    if (pending) {
      clearTimeout(pending.timer);
      if (pending.fallbackTimer) clearTimeout(pending.fallbackTimer);
      pending.unsubscribeConsole?.();
    }
    this.pending.delete(matchId);
  }

  private async transition(
    matchId: string,
    from: MatchState,
    to: MatchState,
    reason: string,
    finished: boolean,
  ): Promise<void> {
    if (from === to) return;

    await db().match.update({
      where: { id: matchId },
      data: {
        state: to,
        lastError: null,
        ...(finished ? { endedAt: new Date() } : {}),
      },
    });
    await db().matchTransition.create({
      data: { matchId, fromState: from, toState: to, reason },
    });

    logger.info({ matchId, from, to, reason }, 'match transition');
    this.publish(matchId, { state: to, from, reason });
  }

  private startStreamerNag(matchId: string): void {
    this.stopStreamerNag(matchId);
    const timer = setInterval(() => {
      void (async () => {
        try {
          const match = await loadMatch(matchId);
          if (match.state !== 'WARMUP' || match.streamersReady) {
            this.stopStreamerNag(matchId);
            return;
          }
          await this.send(match, sayCommands('Streamers are not ready'));
        } catch (error: unknown) {
          logger.warn({ matchId, error }, 'streamers-ready nag failed');
          this.stopStreamerNag(matchId);
        }
      })();
    }, STREAMERS_NAG_MS);
    timer.unref?.();
    this.streamerNags.set(matchId, timer);
  }

  private stopStreamerNag(matchId: string): void {
    const timer = this.streamerNags.get(matchId);
    if (timer) clearInterval(timer);
    this.streamerNags.delete(matchId);
  }

  private startReadyNag(matchId: string): void {
    this.stopReadyNag(matchId);
    const timer = setInterval(() => {
      void (async () => {
        try {
          const match = await loadMatch(matchId);
          if (match.state !== 'WARMUP' || !match.streamersReady) {
            this.stopReadyNag(matchId);
            return;
          }
          await this.send(match, sayCommands(READY_NAG_MESSAGE));
        } catch (error: unknown) {
          logger.warn({ matchId, error }, 'ready nag failed');
          this.stopReadyNag(matchId);
        }
      })();
    }, READY_NAG_MS);
    timer.unref?.();
    this.readyNags.set(matchId, timer);
  }

  private stopReadyNag(matchId: string): void {
    const timer = this.readyNags.get(matchId);
    if (timer) clearInterval(timer);
    this.readyNags.delete(matchId);
  }

  private publish(matchId: string, payload: Record<string, unknown>): void {
    bus.publish(`match:${matchId}`, { matchId, ...payload });
  }
}

function winnerSideFromEvent(event: GameEvent): 'CT' | 'TERRORIST' | null {
  const raw =
    event.data.winner ??
    event.data.to ??
    event.data.team ??
    event.data.notice ??
    event.data.event ??
    '';
  const token = String(raw).toUpperCase();
  if (!token) return null;
  if (
    token === 'CT' ||
    token.includes('CTS_WIN') ||
    token.includes('CT_WIN') ||
    token.includes('BOMB_DEFUSED') ||
    token.includes('TARGET_SAVED') ||
    token.includes('HOSTAGES_RESCUED')
  ) {
    return 'CT';
  }
  if (
    token === 'TERRORIST' ||
    token === 'T' ||
    token.includes('TERRORISTS_WIN') ||
    token.includes('TERRORIST_WIN') ||
    token.includes('TARGET_BOMBED')
  ) {
    return 'TERRORIST';
  }
  return null;
}

export const matches = new MatchRunner();
