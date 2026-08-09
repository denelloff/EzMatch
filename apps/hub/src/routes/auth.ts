import { timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * The internal API is only ever called by the panel process. It is protected by
 * a shared secret rather than user sessions, because by the time a request
 * reaches here the panel has already checked the operator's role.
 */
const PUBLIC_PATHS = new Set(['/health']);

export function makeInternalGuard(expectedToken: string) {
  const expected = Buffer.from(expectedToken, 'utf8');

  return async function guard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    // Liveness probes come from orchestrators that have no business holding the
    // internal secret.
    if (PUBLIC_PATHS.has(request.url.split('?')[0] ?? '')) return;

    const header = request.headers['x-ppanel-internal'];
    const provided = Buffer.from(
      typeof header === 'string' ? header : '',
      'utf8',
    );
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      await reply.code(401).send({ error: 'unauthorized' });
    }
  };
}

