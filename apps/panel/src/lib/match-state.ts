import type { MatchState } from '@ppanel/db';

/**
 * States where the match still occupies a server. DRAFT is excluded because
 * nothing has been pushed to the game yet.
 */
export const LIVE_MATCH_STATES = [
  'WARMUP',
  'KNIFE',
  'KNIFE_DECISION',
  'LIVE',
  'PAUSED',
  'HALFTIME',
  'OVERTIME',
] as const satisfies readonly MatchState[];

export const ARCHIVED_MATCH_STATES = [
  'FINISHED',
  'CANCELLED',
] as const satisfies readonly MatchState[];

/** Wording follows eBot: the status column reads as a short phase name. */
export const STATE_LABEL: Record<MatchState, string> = {
  DRAFT: 'Not started',
  WARMUP: 'Warmup',
  KNIFE: 'Knife round',
  KNIFE_DECISION: 'Side decision',
  LIVE: 'Live',
  PAUSED: 'Paused',
  HALFTIME: 'Halftime',
  OVERTIME: 'Overtime',
  FINISHED: 'Finished',
  CANCELLED: 'Cancelled',
};

export const STATE_TONE: Record<MatchState, 'ok' | 'warn' | 'danger' | 'neutral' | 'info'> = {
  DRAFT: 'neutral',
  WARMUP: 'warn',
  KNIFE: 'warn',
  KNIFE_DECISION: 'warn',
  LIVE: 'ok',
  PAUSED: 'warn',
  HALFTIME: 'warn',
  OVERTIME: 'ok',
  FINISHED: 'neutral',
  CANCELLED: 'danger',
};

/** A match is "running" once the server has been prepared for it. */
export function isLiveState(state: MatchState): boolean {
  return (LIVE_MATCH_STATES as readonly MatchState[]).includes(state);
}

/** Two-digit score, the way eBot prints it (`10 - 08`). */
export function formatScore(value: number): string {
  return value.toString().padStart(2, '0');
}

