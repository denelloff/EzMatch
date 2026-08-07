import { appendFile, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { log } from './logger.js';

/**
 * Holds messages the agent could not deliver yet.
 *
 * A dropped connection during a match must not lose the round results, so the
 * queue spills to disk once it outgrows memory and survives an agent restart.
 * Console lines are explicitly excluded from spilling: they are a live view,
 * and replaying an hour of scrollback after a reconnect is noise, not data.
 */
const MEMORY_LIMIT = 500;
const DISK_LIMIT_BYTES = 32 * 1024 * 1024;

export class Spool {
  private memory: string[] = [];
  private readonly filePath: string;
  private diskBytes = 0;
  private ready: Promise<void>;

  constructor(stateDir: string) {
    this.filePath = join(stateDir, 'spool.jsonl');
    this.ready = this.init(stateDir);
  }

  private async init(stateDir: string): Promise<void> {
    try {
      await mkdir(stateDir, { recursive: true });
      const info = await stat(this.filePath).catch(() => null);
      this.diskBytes = info?.size ?? 0;
    } catch (error) {
      log.warn('spool directory is not writable, buffering in memory only', {
        stateDir,
        error,
      });
    }
  }

  async push(encoded: string): Promise<void> {
    await this.ready;
    this.memory.push(encoded);
    if (this.memory.length > MEMORY_LIMIT) {
      await this.spill();
    }
  }

  private async spill(): Promise<void> {
    const batch = this.memory.splice(0, this.memory.length);
    if (batch.length === 0) return;

    const payload = `${batch.join('\n')}\n`;
    if (this.diskBytes + payload.length > DISK_LIMIT_BYTES) {
      log.warn('spool disk limit reached, discarding the oldest buffered batch', {
        diskBytes: this.diskBytes,
        dropped: batch.length,
      });
      return;
    }

    try {
      await appendFile(this.filePath, payload, 'utf8');
      this.diskBytes += payload.length;
    } catch (error) {
      log.error('failed to spill the spool to disk', { error });
    }
  }

  /**
   * Yields everything buffered, oldest first, and clears the queue. The caller
   * pushes anything it fails to send back in.
   */
  async drain(): Promise<string[]> {
    await this.ready;
    const fromDisk: string[] = [];

    if (this.diskBytes > 0) {
      try {
        const contents = await readFile(this.filePath, 'utf8');
        for (const line of contents.split('\n')) {
          if (line.trim()) fromDisk.push(line);
        }
        await rm(this.filePath, { force: true });
        this.diskBytes = 0;
      } catch (error) {
        log.error('failed to read the spool from disk', { error });
      }
    }

    const fromMemory = this.memory.splice(0, this.memory.length);
    return [...fromDisk, ...fromMemory];
  }

  get size(): number {
    return this.memory.length;
  }

  async flushToDisk(): Promise<void> {
    await this.spill();
  }
}
