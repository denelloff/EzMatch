import { pino } from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // Defence in depth: even if a secret slips into a log call, pino removes it
  // before the line is written.
  redact: {
    paths: [
      'gsltToken',
      'rconPassword',
      'joinPassword',
      'token',
      'password',
      '*.gsltToken',
      '*.rconPassword',
      '*.joinPassword',
      '*.token',
      '*.password',
      'config.gsltToken',
      'config.rconPassword',
      'config.joinPassword',
      'req.headers.authorization',
    ],
    censor: '[redacted]',
  },
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss.l' },
      },
});

export type Logger = typeof logger;

