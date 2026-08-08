import { PassThrough, type Duplex } from 'node:stream';
import { redact } from '@ppanel/protocol';
import { docker, isNotFound } from './client.js';
import { log } from '../logger.js';

export type ConsoleListener = (line: string, ts: string) => void;

const REATTACH_DELAY_MS = 3000;
/** A single console line longer than this is a runaway, not output. */
const MAX_LINE_LENGTH = 8192;

/**
 * One attach connection per container, shared by every consumer.
 *
 * Docker allows several concurrent attaches, but each one gets its own copy of
 * the stream and, more importantly, its own stdin. Multiplexing here keeps a
 * single writer to the server console, so commands cannot interleave halfway
 * through a line.
 */
export class ConsoleSession {
  private stream: Duplex | null = null;
  private listeners = new Set<ConsoleListener>();
  private buffer = '';
  private reattachTimer: NodeJS.Timeout | null = null;
  private stopped = false;
  private attaching = false;
  /** Values masked before a line leaves this process. */
  private secrets: string[] = [];

  constructor(
    readonly instanceId: string,
    readonly containerName: string,
  ) {}

  setSecrets(secrets: string[]): void {
    this.secrets = secrets.filter((secret) => secret.length >= 6);
  }

  subscribe(listener: ConsoleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(): Promise<void> {
    this.stopped = false;
    await this.attach();
  }

  stop(): void {
    this.stopped = true;
    if (this.reattachTimer) clearTimeout(this.reattachTimer);
    this.reattachTimer = null;
    this.stream?.destroy();
    this.stream = null;
  }

  get isAttached(): boolean {
    return this.stream !== null && !this.stream.destroyed;
  }

  /** True when Docker reports the CS2 container as running. */
  async isContainerRunning(): Promise<boolean> {
    try {
      const info = await docker.getContainer(this.containerName).inspect();
      return Boolean(info.State.Running);
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }

  private async attach(): Promise<void> {
    if (this.stopped || this.attaching || this.isAttached) return;
    this.attaching = true;

    try {
      const container = docker.getContainer(this.containerName);
      const info = await container.inspect();
      if (!info.State.Running) {
        this.scheduleReattach();
        return;
      }

      const stream = (await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true,
        hijack: true,
      })) as Duplex;

      this.stream = stream;

      if (info.Config.Tty) {
        // A TTY-backed container emits one raw stream with stdout and stderr
        // already merged, so there is no frame header to strip.
        stream.on('data', (chunk: Buffer) => this.ingest(chunk));
      } else {
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        docker.modem.demuxStream(stream, stdout, stderr);
        stdout.on('data', (chunk: Buffer) => this.ingest(chunk));
        stderr.on('data', (chunk: Buffer) => this.ingest(chunk));
      }

      stream.on('end', () => this.onDetached('stream ended'));
      stream.on('close', () => this.onDetached('stream closed'));
      stream.on('error', (error) => {
        log.warn('console stream error', { instanceId: this.instanceId, error });
        this.onDetached('stream error');
      });

      log.info('console attached', { instanceId: this.instanceId });
    } catch (error) {
      if (!isNotFound(error)) {
        log.warn('console attach failed', { instanceId: this.instanceId, error });
      }
      this.scheduleReattach();
    } finally {
      this.attaching = false;
    }
  }

  private onDetached(reason: string): void {
    if (this.stream) {
      this.stream.removeAllListeners();
      this.stream = null;
    }
    if (this.stopped) return;
    log.info('console detached', { instanceId: this.instanceId, reason });
    this.scheduleReattach();
  }

  private scheduleReattach(): void {
    if (this.stopped || this.reattachTimer) return;
    this.reattachTimer = setTimeout(() => {
      this.reattachTimer = null;
      void this.attach();
    }, REATTACH_DELAY_MS);
    this.reattachTimer.unref?.();
  }

  private ingest(chunk: Buffer): void {
    this.buffer += chunk.toString('utf8');

    if (this.buffer.length > MAX_LINE_LENGTH * 4) {
      this.buffer = this.buffer.slice(-MAX_LINE_LENGTH);
    }

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    const ts = new Date().toISOString();
    for (const rawLine of lines) {
      const line = redact(
        rawLine.replace(/\r$/, '').slice(0, MAX_LINE_LENGTH),
        this.secrets,
      );
      if (!line.trim()) continue;
      for (const listener of this.listeners) {
        try {
          listener(line, ts);
        } catch (error) {
          log.warn('console listener threw', { error });
        }
      }
    }
  }

  /** Writes a command to the server console. */
  async send(command: string): Promise<void> {
    if (!(await this.isContainerRunning())) {
      throw new Error(
        'CS2 container is not running. Start the instance, wait until the map loads, then try again.',
      );
    }

    // After restart, attach can lag a few seconds behind State.Running.
    for (let attempt = 0; attempt < 8 && !this.isAttached; attempt++) {
      await this.attach();
      if (!this.isAttached) await delay(1000);
    }
    if (!this.stream) {
      const codeHint = 'Docker attach failed (container may have just stopped).';
      throw new Error(
        `Console is not attached. ${codeHint} Start the instance and retry.`,
      );
    }
    // A newline inside the payload would let one command smuggle in another.
    const sanitized = command.replace(/[\r\n]+/g, ' ').trim();
    if (!sanitized) return;
    this.stream.write(`${sanitized}\n`);
  }

  /**
   * Runs commands and collects whatever the console prints for `captureMs`.
   * Used for checks like `meta list` where the answer only exists as output.
   */
  async sendAndCapture(
    commands: { command: string; delayMs: number }[],
    captureMs: number,
  ): Promise<string[]> {
    const collected: string[] = [];
    const unsubscribe =
      captureMs > 0 ? this.subscribe((line) => collected.push(line)) : () => {};

    try {
      for (const item of commands) {
        await this.send(item.command);
        if (item.delayMs > 0) await delay(item.delayMs);
      }
      if (captureMs > 0) await delay(captureMs);
    } finally {
      unsubscribe();
    }

    return collected;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
