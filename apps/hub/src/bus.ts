import { EventEmitter } from 'node:events';

/**
 * In-process fan-out from agent connections to the SSE endpoints the panel
 * subscribes to. Deliberately not durable: anything that must survive a hub
 * restart is written to the database first, and the stream is only the live
 * tail on top of it.
 */
export type BusTopic =
  | `console:${string}`
  | `task:${string}`
  | `instance:${string}`
  | `server:${string}`
  | `match:${string}`
  | `events:${string}`;

export interface BusMessage {
  topic: BusTopic;
  data: unknown;
}

class Bus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // One listener per open browser tab per topic adds up quickly, and the
    // default limit of 10 would start printing warnings.
    this.emitter.setMaxListeners(0);
  }

  publish(topic: BusTopic, data: unknown): void {
    this.emitter.emit(topic, data);
  }

  subscribe(topic: BusTopic, handler: (data: unknown) => void): () => void {
    this.emitter.on(topic, handler);
    return () => {
      this.emitter.off(topic, handler);
    };
  }
}

export const bus = new Bus();
