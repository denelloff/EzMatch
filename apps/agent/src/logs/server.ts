import { createServer, type Server } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { GameEvent } from '@ppanel/protocol';
import { log } from '../logger.js';
import { normalizeBatch } from './normalize.js';

/** A single POST from CS2 is a handful of lines; anything huge is not ours. */
const MAX_BODY_BYTES = 4 * 1024 * 1024;

interface Registration {
  instanceId: string;
  token: string;
  secrets: string[];
}

export type EventSink = (instanceId: string, events: GameEvent[]) => void;

/**
 * Receives the CS2 log feed configured with `logaddress_add_http`.
 *
 * The endpoint only exists inside the `ppanel` Docker network, but the path
 * still carries a per-instance token. Any container sharing that network could
 * otherwise inject fabricated round results and drive the match state machine.
 */
export class LogServer {
  private server: Server | null = null;
  private readonly registrations = new Map<string, Registration>();

  constructor(
    private readonly port: number,
    private readonly sink: EventSink,
  ) {}

  /** Issues the URL an instance should post its logs to. */
  register(instanceId: string, secrets: string[], agentHost: string): string {
    const existing = this.registrations.get(instanceId);
    const token = existing?.token ?? randomBytes(18).toString('base64url');
    this.registrations.set(instanceId, { instanceId, token, secrets });
    return `http://${agentHost}:${this.port}/ingest/${instanceId}/${token}`;
  }

  unregister(instanceId: string): void {
    this.registrations.delete(instanceId);
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = createServer((request, response) => {
        this.handle(request, response);
      });

      server.on('error', reject);
      server.listen(this.port, '0.0.0.0', () => {
        log.info('log receiver listening', { port: this.port });
        this.server = server;
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    if (!server) return;
    this.server = null;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  private handle(
    request: import('node:http').IncomingMessage,
    response: import('node:http').ServerResponse,
  ): void {
    if (request.method !== 'POST') {
      response.writeHead(405).end();
      return;
    }

    const match = /^\/ingest\/([^/]+)\/([^/?]+)/.exec(request.url ?? '');
    if (!match) {
      response.writeHead(404).end();
      return;
    }

    const registration = this.registrations.get(match[1]!);
    if (!registration || !tokensMatch(registration.token, match[2]!)) {
      response.writeHead(403).end();
      return;
    }

    const chunks: Buffer[] = [];
    let size = 0;

    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        response.writeHead(413).end();
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (request.destroyed) return;
      // CS2 keeps posting regardless of the response, so acknowledge first and
      // parse afterwards. A slow parse must not stall the game server.
      response.writeHead(200).end();

      const body = Buffer.concat(chunks).toString('utf8');
      if (!body.trim()) return;

      try {
        const events = normalizeBatch(body, registration.secrets);
        if (events.length > 0) {
          this.sink(registration.instanceId, events);
        }
      } catch (error) {
        log.error('failed to normalize a log batch', {
          instanceId: registration.instanceId,
          error,
        });
      }
    });

    request.on('error', (error) => {
      log.warn('log request errored', { error });
    });
  }
}

function tokensMatch(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

