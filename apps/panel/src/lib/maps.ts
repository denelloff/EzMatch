import { prisma } from '@/lib/db';

export type MapPoolKind = 'ACTIVE_DUTY' | 'COMPETITIVE' | 'CUSTOM';

export interface OfficialMapDef {
  name: string;
  label: string;
  pool: Exclude<MapPoolKind, 'CUSTOM'>;
  sortOrder: number;
}

/**
 * Valve Active Duty (Premier Season 5, Jul 2026) plus common competitive
 * maps still useful for scrims. Missing rows are upserted on settings load.
 */
export const OFFICIAL_MAPS: OfficialMapDef[] = [
  { name: 'de_ancient', label: 'Ancient', pool: 'ACTIVE_DUTY', sortOrder: 10 },
  { name: 'de_anubis', label: 'Anubis', pool: 'ACTIVE_DUTY', sortOrder: 20 },
  { name: 'de_cache', label: 'Cache', pool: 'ACTIVE_DUTY', sortOrder: 30 },
  { name: 'de_dust2', label: 'Dust II', pool: 'ACTIVE_DUTY', sortOrder: 40 },
  { name: 'de_inferno', label: 'Inferno', pool: 'ACTIVE_DUTY', sortOrder: 50 },
  { name: 'de_mirage', label: 'Mirage', pool: 'ACTIVE_DUTY', sortOrder: 60 },
  { name: 'de_nuke', label: 'Nuke', pool: 'ACTIVE_DUTY', sortOrder: 70 },
  { name: 'de_overpass', label: 'Overpass', pool: 'COMPETITIVE', sortOrder: 110 },
  { name: 'de_train', label: 'Train', pool: 'COMPETITIVE', sortOrder: 120 },
  { name: 'de_vertigo', label: 'Vertigo', pool: 'COMPETITIVE', sortOrder: 130 },
];

export const MAP_NAME_RE = /^[a-z0-9_]+$/;

/** Inserts any official map that is not yet in the database. */
export async function ensureOfficialMaps(): Promise<void> {
  for (const map of OFFICIAL_MAPS) {
    await prisma.gameMap.upsert({
      where: { name: map.name },
      create: {
        name: map.name,
        label: map.label,
        pool: map.pool,
        enabled: true,
        sortOrder: map.sortOrder,
      },
      // Do not flip enabled/sort for existing rows — admins may have tuned them.
      update: {
        label: map.label,
        pool: map.pool,
      },
    });
  }
}

export interface MapOption {
  name: string;
  label: string;
}

export async function listEnabledMaps(): Promise<MapOption[]> {
  await ensureOfficialMaps();
  return prisma.gameMap.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { name: true, label: true },
  });
}

/** @deprecated Prefer listEnabledMaps for labeled dropdowns. */
export async function listEnabledMapNames(): Promise<string[]> {
  const maps = await listEnabledMaps();
  return maps.map((map) => map.name);
}

export async function listAllMaps() {
  await ensureOfficialMaps();
  return prisma.gameMap.findMany({
    orderBy: [{ pool: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
}
