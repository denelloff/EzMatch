import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client.js';

export type { PrismaClient };

let singleton: PrismaClient | undefined;

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
 */
export function getPrisma(options?: Partial<PrismaOptions>): PrismaClient {
  const globalRef = globalThis as typeof globalThis & {
    __ppanelPrisma?: PrismaClient;
  };
  if (globalRef.__ppanelPrisma) return globalRef.__ppanelPrisma;
  if (singleton) return singleton;

  const url = options?.url ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const client = createPrismaClient({ url, log: options?.log ?? false });
  singleton = client;
  if (process.env.NODE_ENV !== 'production') {
    globalRef.__ppanelPrisma = client;
  }
  return client;
}
