import type { MatchState } from '@ppanel/db';
import { demoNameFor, type ConsoleCommand, type DemoFile, type GameEvent } from '@ppanel/protocol';
import { agents } from '../agent/registry.js';
import { ingest } from '../agent/ingest.js';
import { bus } from '../bus.js';
import { db } from '../db.js';
import { logger } from '../logger.js';
import {
  endCommands,
  knifeCommands,
  liveCommands,
  listBackupsCommands,
  parseBackupList,
  pauseCommands,
  prepareCommands,
  restoreCommands,
  startRecordingCommands,
  stopRecordingCommands,
  swapCommands,
  unpauseCommands,
  warmupCommands,
  type MatchSettings,
} from './commands.js';

/**
 * How long to wait for the log line that proves a transition happened. On
 * expiry the match stays where it was and says why, instead of pretending the
 * server did something it did not: a match that silently believes it is live
 * while the server is in warmup is worse than one that reports it is stuck.
 */
const CONFIRM_TIMEOUT_MS = 45_000;

interface Pending {
  toState: MatchState;
  reason: string;
  accepts: (event: GameEvent) => boolean;
  onCommit?: () => Promise<void>;
  timer: NodeJS.Timeout;
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
    backupPrefix: match.backupPrefix,
  };
}

class MatchRunner {
  private readonly pending = new Map<string, Pending>();

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
      select: { id: true, instanceId: true },
    });
    for (const match of live) {
      ingest.setActiveMatch(match.instanceId, match.id);
    }
    if (live.length > 0) {
      logger.info({ count: live.length }, 'resumed matches in progress');
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

    // The map change is the slow part; confirmation is the map actually coming
    // up, not the command being accepted.
    await this.sendExpecting(match, prepareCommands(settingsOf(match)), {
      toState: 'WARMUP',
      reason: 'map loaded',
      accepts: (event) =>
        (event.kind === 'map_started' || event.kind === 'map_changed') &&
        String(event.data.map ?? '').includes(match.map),
      onCommit: async () => {
        const fresh = await loadMatch(matchId);
        await this.send(fresh, warmupCommands(settingsOf(fresh)));
      },
    });
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

    await this.sendExpecting(match, knifeCommands(), {
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
    }

    await this.transition(matchId, 'KNIFE_DECISION', 'LIVE', `knife: ${choice}`, false);
    await this.goLive(matchId);
  }

  async goLive(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);

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

    this.clearPending(matchId);
    await this.send(match, stopRecordingCommands()).catch(() => undefined);
    await this.send(match, endCommands()).catch(() => undefined);
    ingest.setActiveMatch(match.instanceId, null);
    await this.transition(matchId, match.state, 'CANCELLED', 'cancelled by an operator', true);
    await this.syncDemos(matchId).catch(() => undefined);
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
        this.clearPending(matchId);
        const match = await loadMatch(matchId);
        await this.transition(
          matchId,
          match.state,
          pending.toState,
          pending.reason,
          false,
        );
        await pending.onCommit?.();
      }

      await this.applyEvent(matchId, event);
    }
  }

  private async applyEvent(matchId: string, event: GameEvent): Promise<void> {
    switch (event.kind) {
      case 'match_status':
        await this.applyScore(matchId, event);
        break;

      case 'round_end':
        await this.onRoundEnd(matchId);
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
        await this.setConnected(matchId, event, true);
        break;

      case 'player_disconnect':
        await this.setConnected(matchId, event, false);
        break;

      default:
        break;
    }
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

  private async onRoundEnd(matchId: string): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state !== 'KNIFE') return;

    // The knife round is decided by whoever is left standing, and the server
    // reports that as a normal round win. Which side won is read from the score
    // that follows, so all this transition does is hand the choice to the
    // winning team's operator.
    await this.transition(
      matchId,
      'KNIFE',
      'KNIFE_DECISION',
      'knife round finished',
      false,
    );
  }

  private async onGameOver(matchId: string, event: GameEvent): Promise<void> {
    const match = await loadMatch(matchId);
    if (match.state === 'FINISHED' || match.state === 'CANCELLED') return;
    if (match.state === 'KNIFE' || match.state === 'KNIFE_DECISION') return;

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
    if (!player?.steamId) return;
    const match = await loadMatch(matchId);
    if (match.state !== 'LIVE' && match.state !== 'OVERTIME') return;

    await db().matchPlayer.upsert({
      where: { matchId_steamId: { matchId, steamId: player.steamId } },
      create: {
        matchId,
        steamId: player.steamId,
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
    if (!player?.steamId) return;

    await db()
      .matchPlayer.update({
        where: { matchId_steamId: { matchId, steamId: player.steamId } },
        data: { connected, name: player.name },
      })
      .catch(() => undefined);
  }

  private teamOf(team1Side: string, side: string | null): number {
    if (!side || (side !== 'CT' && side !== 'TERRORIST')) return 0;
    return side === team1Side ? 1 : 2;
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
   */
  private async sendExpecting(
    match: NonNullable<MatchRow>,
    commands: ConsoleCommand[],
    expectation: Omit<Pending, 'timer'>,
  ): Promise<void> {
    this.expect(match, expectation);
    try {
      await this.send(match, commands);
    } catch (error) {
      this.clearPending(match.id);
      throw error;
    }
  }

  private expect(
    match: NonNullable<MatchRow>,
    input: Omit<Pending, 'timer'>,
  ): void {
    this.clearPending(match.id);

    const timer = setTimeout(() => {
      this.pending.delete(match.id);
      const message = `The server did not report "${input.reason}" within ${
        CONFIRM_TIMEOUT_MS / 1000
      }s. The match is still ${match.state.toLowerCase()}.`;
      logger.warn({ matchId: match.id, expected: input.toState }, 'transition not confirmed');
      void db()
        .match.update({ where: { id: match.id }, data: { lastError: message } })
        .catch(() => undefined);
      this.publish(match.id, { error: message });
    }, CONFIRM_TIMEOUT_MS);
    timer.unref?.();

    this.pending.set(match.id, { ...input, timer });
  }

  private clearPending(matchId: string): void {
    const pending = this.pending.get(matchId);
    if (pending) clearTimeout(pending.timer);
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

  private publish(matchId: string, payload: Record<string, unknown>): void {
    bus.publish(`match:${matchId}`, { matchId, ...payload });
  }
}

export const matches = new MatchRunner();
