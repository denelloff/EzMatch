import { z } from 'zod';
import { zIsoDate } from './common.js';

/**
 * A GOTV recording sitting in the instance volume. eZ-Match only indexes what the
 * game wrote; it never renames or moves the files, so a demo stays findable on
 * the host even if the panel loses its database.
 */
export const zDemoFile = z.object({
  /** File name inside the CS2 game directory, e.g. `TeamA vs TeamB - 2026-08-12.dem`. */
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
 *
 * Format: "{title} - {YYYY-MM-DD}" (optionally " #{number}" for uniqueness).
 */
export function demoNameFor(
  title: string,
  options?: { matchNumber?: number | null; at?: Date },
): string {
  const at = options?.at ?? new Date();
  const date = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, '0'),
    String(at.getDate()).padStart(2, '0'),
  ].join('-');

  const safeTitle =
    title
      .replace(/["\\/<>:|?*\n\r\t]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'match';

  const suffix =
    options?.matchNumber != null && Number.isFinite(options.matchNumber)
      ? ` #${options.matchNumber}`
      : '';

  return `${safeTitle} - ${date}${suffix}`;
}
