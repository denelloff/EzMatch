import { prisma } from '@/lib/db';

/** Key in AppSetting for the freezetime prefilled on new matches. */
export const SETTING_DEFAULT_FREEZETIME = 'match.defaultFreezetime';

/** Valve competitive default (seconds). */
export const DEFAULT_FREEZETIME = 15;

export const FREEZETIME_MIN = 0;
export const FREEZETIME_MAX = 60;

export function clampFreezetime(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FREEZETIME;
  const n = Math.trunc(value);
  if (n < FREEZETIME_MIN) return FREEZETIME_MIN;
  if (n > FREEZETIME_MAX) return FREEZETIME_MAX;
  return n;
}

export async function getDefaultFreezetime(): Promise<number> {
  const row = await prisma.appSetting.findUnique({
    where: { key: SETTING_DEFAULT_FREEZETIME },
  });
  if (!row) return DEFAULT_FREEZETIME;
  const parsed = Number(row.value);
  if (!Number.isInteger(parsed)) return DEFAULT_FREEZETIME;
  return clampFreezetime(parsed);
}

export async function setDefaultFreezetime(value: number): Promise<number> {
  const freezetime = clampFreezetime(value);
  await prisma.appSetting.upsert({
    where: { key: SETTING_DEFAULT_FREEZETIME },
    create: {
      key: SETTING_DEFAULT_FREEZETIME,
      value: String(freezetime),
    },
    update: { value: String(freezetime) },
  });
  return freezetime;
}
