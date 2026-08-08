'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MAP_NAME_RE } from '@/lib/maps';

export interface MapFormState {
  error: string | null;
  ok: boolean;
}

const addSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(MAP_NAME_RE, 'Map name: lowercase letters, digits, underscores'),
  label: z.string().min(1).max(64),
});

function isRedirect(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'digest' in error &&
    String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

export async function addMapAction(
  _prev: MapFormState,
  formData: FormData,
): Promise<MapFormState> {
  try {
    const user = await assertRole('ADMIN');
    const parsed = addSchema.safeParse({
      name: String(formData.get('name') ?? '')
        .trim()
        .toLowerCase(),
      label: String(formData.get('label') ?? '').trim(),
    });
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid input',
        ok: false,
      };
    }

    const existing = await prisma.gameMap.findUnique({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return { error: `Map "${parsed.data.name}" already exists.`, ok: false };
    }

    const maxSort = await prisma.gameMap.aggregate({
      where: { pool: 'CUSTOM' },
      _max: { sortOrder: true },
    });

    const map = await prisma.gameMap.create({
      data: {
        name: parsed.data.name,
        label: parsed.data.label,
        pool: 'CUSTOM',
        enabled: true,
        sortOrder: (maxSort._max.sortOrder ?? 200) + 10,
      },
    });

    await audit(user, 'map.create', 'game_map', map.id, {
      name: map.name,
      label: map.label,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin/matches/new');
    return { error: null, ok: true };
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to manage maps.', ok: false };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      ok: false,
    };
  }
}

export async function toggleMapAction(formData: FormData): Promise<void> {
  const user = await assertRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  const enabled = formData.get('enabled') === '1';
  if (!id) return;

  const map = await prisma.gameMap.update({
    where: { id },
    data: { enabled },
  });

  await audit(user, 'map.toggle', 'game_map', map.id, {
    name: map.name,
    enabled,
  });

  revalidatePath('/admin/settings');
  revalidatePath('/admin/matches/new');
}

export async function deleteMapAction(formData: FormData): Promise<void> {
  const user = await assertRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const map = await prisma.gameMap.findUnique({ where: { id } });
  if (!map) return;
  if (map.pool !== 'CUSTOM') {
    throw new Error('Only custom maps can be deleted.');
  }

  await prisma.gameMap.delete({ where: { id } });
  await audit(user, 'map.delete', 'game_map', id, { name: map.name });

  revalidatePath('/admin/settings');
  revalidatePath('/admin/matches/new');
}
