type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[(process.env.LOG_LEVEL as Level) ?? 'info'] ?? LEVELS.info;

function emit(level: Level, message: string, context?: unknown): void {
  if (LEVELS[level] < threshold) return;
  const line = {
    t: new Date().toISOString(),
    level,
    msg: message,
    ...(context && typeof context === 'object' ? context : context ? { context } : {}),
  };
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(line, replacer)}\n`);
}

/**
 * The agent is deliberately dependency-light, so error objects need explicit
 * handling to avoid logging an empty `{}`.
 */
function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

export const log = {
  debug: (message: string, context?: unknown) => emit('debug', message, context),
  info: (message: string, context?: unknown) => emit('info', message, context),
  warn: (message: string, context?: unknown) => emit('warn', message, context),
  error: (message: string, context?: unknown) => emit('error', message, context),
};

