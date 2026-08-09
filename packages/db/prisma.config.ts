import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Prisma runs with this package as the working directory, so a bare dotenv
// import would miss the repository-root .env that every app shares. The local
// file is read first because dotenv does not overwrite what is already set.
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '.env'), quiet: true });
config({ path: resolve(here, '../../.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
