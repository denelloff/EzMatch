import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { initDb, db } from './db.js';
import { logger } from './logger.js';
import { attachAgentGateway } from './agent/gateway.js';
import { ingest, pruneConsole } from './agent/ingest.js';
import { makeInternalGuard } from './routes/auth.js';
import { matches } from './match/runner.js';
import { registerInstanceRoutes } from './routes/instances.js';
import { registerMatchRoutes } from './routes/matches.js';
import { registerServerRoutes } from './routes/servers.js';
import { registerStreamRoutes } from './routes/stream.js';
import { registerTaskRoutes } from './routes/tasks.js';

const CONSOLE_PRUNE_INTERVAL_MS = 5 * 60_000;

async function main(): Promise<void> {
  const config = loadConfig();
  initDb(config.databaseUrl);
  ingest.start();
  matches.attach();
  await matches.resume();

  const app = createApp();

  app.get('/health', async () => {
    await db().$queryRaw`SELECT 1`;
    return { ok: true };
  });

  app.addHook('onRequest', makeInternalGuard(config.internalToken));

  registerServerRoutes(app, config);
  registerInstanceRoutes(app, config);
  registerMatchRoutes(app);
  registerStreamRoutes(app);
  registerTaskRoutes(app);

  await app.listen({ host: config.host, port: config.port });

  const detachGateway = attachAgentGateway(app.server, config);

  const pruneTimer = setInterval(() => {
    void pruneConsole(config.consoleRetentionLines).catch((error: unknown) => {
      logger.error({ error }, 'console prune failed');
    });
  }, CONSOLE_PRUNE_INTERVAL_MS);
  pruneTimer.unref?.();

  logger.info(
    { port: config.port, publicUrl: config.agent.hubPublicUrl },
    'hub listening',
  );

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    clearInterval(pruneTimer);
    detachGateway();
    await ingest.stop();
    await app.close();
    await db().$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  logger.fatal({ error }, 'hub failed to start');
  process.exit(1);
});
