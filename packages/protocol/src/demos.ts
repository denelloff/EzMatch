import { z } from 'zod';
import { zIsoDate } from './common.js';

/**
 * A GOTV recording sitting in the instance volume. PPanel only indexes what the
 * game wrote; it never renames or moves the files, so a demo stays findable on
 * the host even if the panel loses its database.
 */
export const zDemoFile = z.object({
  /** File name inside the CS2 game directory, e.g. `ppanel_ab12cd.dem`. */
  name: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  modifiedAt: zIsoDate,
});
export type DemoFile = z.infer<typeof zDemoFile>;

export const zDemoList = z.object({
  files: z.array(zDemoFile),
});
export type DemoList = z.infer<typeof zDemoList>;

/**
 * GOTV rejects names with path separators or quotes, and a match title can hold
 * anything, so the recording name is derived rather than taken verbatim.
 */
export function demoNameFor(matchId: string, map: string): string {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const safeMap = map.replace(/[^a-z0-9_]/gi, '').slice(0, 24) || 'map';
  return `ppanel_${stamp}_${safeMap}_${matchId.slice(-6)}`;
}
