import type { GameEvent } from '@ppanel/protocol';
import { bus } from '../bus.js';
import { db } from '../db.js';
import { logger } from '../logger.js';

/**
 * A busy server emits console output and game events far faster than one row
 * per insert can keep up with, so both streams are batched. Live viewers get
 * the data immediately over the bus; the database write only has to keep up on
 * average, not per line.
 */
const FLUSH_INTERVAL_MS = 500;
const MAX_BATCH = 250;
/** Beyond this the writer is losing; drop the oldest rather than run out of memory. */
const MAX_BUFFER = 5000;

interface ConsoleRow {
  instanceId: string;
  ts: Date;
  line: string;
}

interface EventRow {
  instanceId: string;
  matchId: string | null;
  ts: Date;
  kind: string;
  category: string;
  sourceType: string;
  actorName: string | null;
  actorSteamId: string | null;
  actorSide: string | null;
  targetName: string | null;
  targetSteamId: string | null;
  targetSide: string | null;
  data: object;
  raw: string;
}

export type GameEventHook = (
  instanceId: string,
  events: GameEvent[],
) => void | Promise<void>;

class Ingest {
  private consoleBuffer: ConsoleRow[] = [];
  private eventBuffer: EventRow[] = [];
  private droppedConsole = 0;
  private droppedEvents = 0;
  private timer: NodeJS.Timeout | null = null;
  private flushing = false;
  private hooks: GameEventHook[] = [];
  /** instanceId -> active match id, refreshed when a match starts or ends. */
  private readonly activeMatch = new Map<string, string | null>();

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.flush();
  }

  onGameEvents(hook: GameEventHook): void {
    this.hooks.push(hook);
  }

  setActiveMatch(instanceId: string, matchId: string | null): void {
    this.activeMatch.set(instanceId, matchId);
  }

  getActiveMatch(instanceId: string): string | null {
    return this.activeMatch.get(instanceId) ?? null;
  }

  console(instanceId: string, ts: string, line: string): void {
    bus.publish(`console:${instanceId}`, { ts, line });
    if (this.consoleBuffer.length >= MAX_BUFFER) {
      this.consoleBuffer.shift();
      this.droppedConsole += 1;
      return;
    }
    this.consoleBuffer.push({ instanceId, ts: new Date(ts), line });
  }

  events(instanceId: string, events: GameEvent[]): void {
    bus.publish(`events:${instanceId}`, events);

    const matchId = this.getActiveMatch(instanceId);
    for (const event of events) {
      if (this.eventBuffer.length >= MAX_BUFFER) {
        this.eventBuffer.shift();
        this.droppedEvents += 1;
        continue;
      }
      this.eventBuffer.push({
        instanceId,
        matchId,
        ts: new Date(event.ts),
        kind: event.kind,
        category: event.category,
        sourceType: event.sourceType,
        actorName: event.actor?.name ?? null,
        actorSteamId: event.actor?.steamId ?? null,
        actorSide: event.actor?.side ?? null,
        targetName: event.target?.name ?? null,
        targetSteamId: event.target?.steamId ?? null,
        targetSide: event.target?.side ?? null,
        data: event.data as object,
        raw: event.raw,
      });
    }

    for (const hook of this.hooks) {
      void Promise.resolve(hook(instanceId, events)).catch((error: unknown) => {
        logger.error({ instanceId, error }, 'game event hook failed');
      });
    }
  }

  private async flush(): Promise<void> {
    if (this.flushing) return;
    if (this.consoleBuffer.length === 0 && this.eventBuffer.length === 0) return;
    this.flushing = true;

    const consoleRows = this.consoleBuffer.splice(0, MAX_BATCH);
    const eventRows = this.eventBuffer.splice(0, MAX_BATCH);

    try {
      if (consoleRows.length > 0) {
        await db().consoleLine.createMany({ data: consoleRows });
      }
      if (eventRows.length > 0) {
        await db().gameEvent.createMany({ data: eventRows });
      }
    } catch (error) {
      logger.error(
        { error, consoleRows: consoleRows.length, eventRows: eventRows.length },
        'ingest flush failed, dropping batch',
      );
    } finally {
      this.flushing = false;
    }

    if (this.droppedConsole > 0 || this.droppedEvents > 0) {
      logger.warn(
        { console: this.droppedConsole, events: this.droppedEvents },
        'ingest buffer overflowed, rows were dropped',
      );
      this.droppedConsole = 0;
      this.droppedEvents = 0;
    }
  }
}

export const ingest = new Ingest();

/**
 * Console scrollback is a ring buffer, not history. Trimming by id keeps the
 * newest N rows per instance without scanning timestamps.
 */
export async function pruneConsole(retainPerInstance: number): Promise<void> {
  const instances = await db().gameInstance.findMany({ select: { id: true } });
  for (const instance of instances) {
    const cutoff = await db().consoleLine.findMany({
      where: { instanceId: instance.id },
      orderBy: { id: 'desc' },
      skip: retainPerInstance,
      take: 1,
      select: { id: true },
    });
    const boundary = cutoff[0]?.id;
    if (boundary === undefined) continue;
    await db().consoleLine.deleteMany({
      where: { instanceId: instance.id, id: { lte: boundary } },
    });
  }
}
