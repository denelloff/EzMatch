import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client.js';

export type { PrismaClient };

let singleton: PrismaClient | undefined;

/**
 * Bump whenever the Prisma schema gains models or fields the panel/hub query.
 * An old `globalThis` client from before a generate still validates against the
 * previous DataModel and throws "Unknown argument …" until it is replaced.
 */
const PRISMA_CLIENT_REV = 4;

export interface PrismaOptions {
  /** MariaDB connection string, e.g. mysql://user:pass@host:3306/ppanel */
  url: string;
  log?: boolean;
}

export function createPrismaClient(options: PrismaOptions): PrismaClient {
  const adapter = new PrismaMariaDb(options.url);
  return new PrismaClient({
    adapter,
    log: options.log ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
}

/**
 * Next.js dev mode re-evaluates modules on every hot reload, which would open a
 * new connection pool each time. Caching on globalThis keeps a single pool.
 *
 * When the Prisma schema gains models/fields, an old cached client is missing
 * those until the process restarts — detect and replace it.
 */
export function getPrisma(options?: Partial<PrismaOptions>): PrismaClient {
  const globalRef = globalThis as typeof globalThis & {
    __ppanelPrisma?: PrismaClient;
    __ppanelPrismaRev?: number;
  };

  const cached = globalRef.__ppanelPrisma ?? singleton;
  if (cached && isStalePrismaClient(cached, globalRef.__ppanelPrismaRev)) {
    void cached.$disconnect().catch(() => undefined);
    globalRef.__ppanelPrisma = undefined;
    globalRef.__ppanelPrismaRev = undefined;
    singleton = undefined;
  } else if (cached) {
    return cached;
  }

  const url = options?.url ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const client = createPrismaClient({ url, log: options?.log ?? false });
  singleton = client;
  if (process.env.NODE_ENV !== 'production') {
    globalRef.__ppanelPrisma = client;
    globalRef.__ppanelPrismaRev = PRISMA_CLIENT_REV;
  }
  return client;
}

/** True when this process still holds a client built before a schema expand. */
function isStalePrismaClient(
  client: PrismaClient,
  rev: number | undefined,
): boolean {
  if (rev !== PRISMA_CLIENT_REV) return true;

  // Keep this list in sync with models the panel expects at runtime.
  const record = client as unknown as Record<
    string,
    { findMany?: unknown } | undefined
  >;
  if (
    typeof record.team?.findMany !== 'function' ||
    typeof record.gameMap?.findMany !== 'function'
  ) {
    return true;
  }

  return !clientKnowsMatchField(client, 'streamersReady');
}

function clientKnowsMatchField(client: PrismaClient, fieldName: string): boolean {
  const internal = client as unknown as {
    _runtimeDataModel?: {
      models?: Record<
        string,
        { fields?: Array<{ name: string }> | Record<string, unknown> }
      >;
    };
  };
  const match = internal._runtimeDataModel?.models?.Match;
  if (!match?.fields) return true;
  if (Array.isArray(match.fields)) {
    return match.fields.some((field) => field.name === fieldName);
  }
  return fieldName in match.fields;
}
