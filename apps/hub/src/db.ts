import { createPrismaClient, type PrismaClient } from '@ppanel/db';

let client: PrismaClient | undefined;

export function initDb(url: string): PrismaClient {
  client = createPrismaClient({ url, log: process.env.LOG_LEVEL === 'debug' });
  return client;
}

export function db(): PrismaClient {
  if (!client) throw new Error('Database is not initialised');
  return client;
}

