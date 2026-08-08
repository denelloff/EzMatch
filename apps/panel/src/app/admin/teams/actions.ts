'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { isCountryCode } from '@/lib/countries';
import { prisma } from '@/lib/db';
import {
  removeTeamLogoFile,
  saveGeneratedTeamLogo,
  saveTeamLogoUpload,
} from '@/lib/teams/logo';
import { CS2_PRO_TEAM_PRESET } from '@/lib/teams/preset';

const TAG = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,15}$/;

const teamSchema = z.object({
  name: z.string().min(1).max(64),
  tag: z
    .string()
    .min(1)
    .max(16)
    .regex(TAG, 'Short name: letters, digits, space, . _ -'),
  country: z
    .string()
    .length(2)
    .transform((value) => value.toLowerCase())
    .refine(isCountryCode, 'Unknown country code'),
});

export interface TeamFormState {
  error: string | null;
}

function isRedirect(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'digest' in error &&
    String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

async function logoFromForm(formData: FormData, stem: string): Promise<string | null> {
  const logo = formData.get('logo');
  if (!(logo instanceof File) || logo.size <= 0) return null;
  return saveTeamLogoUpload(logo, stem);
}

export async function createTeamAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  try {
    const user = await assertRole('ADMIN');
    const parsed = teamSchema.safeParse({
      name: formData.get('name'),
      tag: formData.get('tag'),
      country: formData.get('country'),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const input = parsed.data;

    const team = await prisma.team.create({
      data: {
        name: input.name,
        tag: input.tag,
        country: input.country,
        logoPath: null,
      },
    });

    try {
      const uploaded = await logoFromForm(formData, team.id);
      if (uploaded) {
        await prisma.team.update({
          where: { id: team.id },
          data: { logoPath: uploaded },
        });
      }
    } catch (error) {
      await prisma.team.delete({ where: { id: team.id } }).catch(() => undefined);
      return {
        error: error instanceof Error ? error.message : 'Could not save the logo',
      };
    }

    await audit(user, 'team.create', 'team', team.id, {
      name: team.name,
      tag: team.tag,
      country: team.country,
    });

    revalidatePath('/admin/teams');
    revalidatePath('/admin/teams/new');
    redirect('/admin/teams');
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to create teams.' };
    }
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export async function updateTeamAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  try {
    const user = await assertRole('ADMIN');
    const teamId = String(formData.get('teamId') ?? '');
    if (!teamId) return { error: 'Missing team id' };

    const parsed = teamSchema.safeParse({
      name: formData.get('name'),
      tag: formData.get('tag'),
      country: formData.get('country'),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const input = parsed.data;

    const existing = await prisma.team.findUnique({ where: { id: teamId } });
    if (!existing) return { error: 'Team not found' };

    let logoPath = existing.logoPath;
    const clearLogo = formData.get('clearLogo') === 'on';
    if (clearLogo && logoPath) {
      await removeTeamLogoFile(logoPath);
      logoPath = null;
    }

    try {
      const uploaded = await logoFromForm(formData, teamId);
      if (uploaded) {
        await removeTeamLogoFile(existing.logoPath);
        logoPath = uploaded;
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Could not save the logo',
      };
    }

    await prisma.team.update({
      where: { id: teamId },
      data: {
        name: input.name,
        tag: input.tag,
        country: input.country,
        logoPath,
      },
    });

    await audit(user, 'team.update', 'team', teamId, {
      name: input.name,
      tag: input.tag,
    });

    revalidatePath('/admin/teams');
    revalidatePath(`/admin/teams/${teamId}/edit`);
    redirect('/admin/teams');
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to edit teams.' };
    }
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export async function deleteTeamAction(formData: FormData): Promise<void> {
  const user = await assertRole('ADMIN');
  const teamId = String(formData.get('teamId') ?? '');
  if (!teamId) return;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return;

  await removeTeamLogoFile(team.logoPath);
  await prisma.team.delete({ where: { id: teamId } });
  await audit(user, 'team.delete', 'team', teamId, {
    name: team.name,
    tag: team.tag,
  });
  revalidatePath('/admin/teams');
}

export interface ImportPresetState {
  error: string | null;
  imported: number;
  skipped: number;
}

export async function importProTeamsAction(
  _prev: ImportPresetState,
  _formData: FormData,
): Promise<ImportPresetState> {
  try {
    const user = await assertRole('ADMIN');
    let imported = 0;
    let skipped = 0;

    for (const preset of CS2_PRO_TEAM_PRESET) {
      const existing = await prisma.team.findUnique({
        where: { presetKey: preset.key },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      const logoPath = await saveGeneratedTeamLogo(
        preset.tag,
        preset.color,
        `preset-${preset.key}`,
      );

      await prisma.team.create({
        data: {
          name: preset.name,
          tag: preset.tag,
          country: preset.country,
          logoPath,
          presetKey: preset.key,
        },
      });
      imported += 1;
    }

    await audit(user, 'team.importPreset', 'team', null, { imported, skipped });
    revalidatePath('/admin/teams');
    return { error: null, imported, skipped };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        error: 'You do not have permission to import teams.',
        imported: 0,
        skipped: 0,
      };
    }
    return {
      error: error instanceof Error ? error.message : 'Import failed',
      imported: 0,
      skipped: 0,
    };
  }
}
