import Fastify from 'fastify';
import { logger } from './logger.js';

export function createApp() {
  return Fastify({
    loggerInstance: logger,
    // Batched log payloads from a busy server exceed Fastify's 1 MiB default.
    bodyLimit: 8 * 1024 * 1024,
    trustProxy: true,
  });
}

/**
 * Passing a concrete pino instance makes Fastify's generics resolve to that
 * logger type. Deriving the type from the factory keeps route modules in step
 * without every one of them having to spell the generics out.
 */
export type HubApp = ReturnType<typeof createApp>;

