'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';
import { seal } from '@/lib/secrets';

export interface MatchManageState {
  error: string | null;
  ok: boolean;
}

function isRedirect(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'digest' in error &&
    String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

function revalidateMatchLists(matchId?: string) {
  revalidatePath('/admin/matches/mine');
  revalidatePath('/admin/matches');
  if (matchId) {
    revalidatePath(`/matches/${matchId}`);
    revalidatePath(`/admin/matches/${matchId}`);
  }
}

/** Start = prepare: push match config to the CS2 server via the agent. */
export async function startMatchAction(
  _prev: MatchManageState,
  formData: FormData,
): Promise<MatchManageState> {
  const matchId = String(formData.get('matchId') ?? '');
  try {
    const user = await assertRole('OPERATOR');
    if (!matchId) return { error: 'Missing match.', ok: false };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, state: true, title: true },
    });
    if (!match) return { error: 'Match not found.', ok: false };
    if (match.state !== 'DRAFT') {
      return { error: 'Only a draft match can be started.', ok: false };
    }

    await hubFetch(`/internal/matches/${matchId}/action`, {
      method: 'POST',
      body: { action: 'prepare' },
      timeoutMs: 120_000,
    });

    await audit(user, 'match.start', 'match', matchId, { title: match.title });
    revalidateMatchLists(matchId);
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to start matches.', ok: false };
    }
    if (error instanceof HubError) {
      const detail =
        error.detail && typeof error.detail === 'object' && 'detail' in error.detail
          ? String((error.detail as { detail: unknown }).detail)
          : error.message;
      return { error: detail, ok: false };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      ok: false,
    };
  }
}

export async function restartMatchAction(
  _prev: MatchManageState,
  formData: FormData,
): Promise<MatchManageState> {
  const matchId = String(formData.get('matchId') ?? '');
  try {
    const user = await assertRole('OPERATOR');
    if (!matchId) return { error: 'Missing match.', ok: false };

    await hubFetch(`/internal/matches/${matchId}/action`, {
      method: 'POST',
      body: { action: 'restart' },
      timeoutMs: 120_000,
    });

    await audit(user, 'match.restart', 'match', matchId, {});
    revalidateMatchLists(matchId);
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to restart matches.', ok: false };
    }
    if (error instanceof HubError) {
      const detail =
        error.detail && typeof error.detail === 'object' && 'detail' in error.detail
          ? String((error.detail as { detail: unknown }).detail)
          : error.message;
      return { error: detail, ok: false };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      ok: false,
    };
  }
}

export async function deleteMatchAction(
  _prev: MatchManageState,
  formData: FormData,
): Promise<MatchManageState> {
  const matchId = String(formData.get('matchId') ?? '');
  try {
    const user = await assertRole('ADMIN');
    if (!matchId) return { error: 'Missing match.', ok: false };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, state: true, title: true },
    });
    if (!match) return { error: 'Match not found.', ok: false };
    if (match.state !== 'DRAFT' && match.state !== 'CANCELLED') {
      return {
        error: 'Cancel the match first, or only delete drafts.',
        ok: false,
      };
    }

    await prisma.match.delete({ where: { id: matchId } });
    await audit(user, 'match.delete', 'match', matchId, { title: match.title });
    revalidateMatchLists();
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to delete matches.', ok: false };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      ok: false,
    };
  }
}

export async function duplicateMatchAction(
  _prev: MatchManageState,
  formData: FormData,
): Promise<MatchManageState> {
  const matchId = String(formData.get('matchId') ?? '');
  try {
    const user = await assertRole('OPERATOR');
    if (!matchId) return { error: 'Missing match.', ok: false };

    const source = await prisma.match.findUnique({ where: { id: matchId } });
    if (!source) return { error: 'Match not found.', ok: false };

    const copy = await prisma.match.create({
      data: {
        instanceId: source.instanceId,
        title: `${source.title} (copy)`,
        map: source.map,
        team1Name: source.team1Name,
        team2Name: source.team2Name,
        maxRounds: source.maxRounds,
        overtimeEnabled: source.overtimeEnabled,
        overtimeRounds: source.overtimeRounds,
        overtimeStartMoney: source.overtimeStartMoney,
        knifeRound: source.knifeRound,
        backupPrefix: `ezmatch_${randomBytes(4).toString('hex')}`,
        joinPasswordEnc: source.joinPasswordEnc,
      },
    });

    await audit(user, 'match.duplicate', 'match', copy.id, {
      from: source.id,
    });
    revalidateMatchLists(copy.id);
    redirect(`/admin/matches/${copy.id}/edit`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to duplicate matches.', ok: false };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      ok: false,
    };
  }
}

const editSchema = z.object({
  matchId: z.string().min(1).max(64),
  title: z.string().min(1).max(80),
  map: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/),
  team1Name: z.string().min(1).max(24),
  team2Name: z.string().min(1).max(24),
  maxRounds: z.coerce.number().int().min(2).max(60),
  overtimeEnabled: z.boolean(),
  overtimeRounds: z.coerce.number().int().refine((n) => n === 6 || n === 10),
  overtimeStartMoney: z.coerce.number().int().min(0).max(16_000),
  knifeRound: z.boolean(),
  joinPassword: z.string().max(64).optional(),
  clearJoinPassword: z.boolean(),
});

export async function updateMatchAction(
  _prev: MatchManageState,
  formData: FormData,
): Promise<MatchManageState> {
  try {
    const user = await assertRole('OPERATOR');
    const parsed = editSchema.safeParse({
      matchId: formData.get('matchId'),
      title: formData.get('title'),
      map: formData.get('map'),
      team1Name: formData.get('team1Name'),
      team2Name: formData.get('team2Name'),
      maxRounds: formData.get('maxRounds') || 24,
      overtimeEnabled: formData.get('overtimeEnabled') === 'on',
      overtimeRounds: formData.get('overtimeRounds') || 6,
      overtimeStartMoney: formData.get('overtimeStartMoney') || 10_000,
      knifeRound: formData.get('knifeRound') === 'on',
      joinPassword: String(formData.get('joinPassword') ?? '').trim() || undefined,
      clearJoinPassword: formData.get('clearJoinPassword') === 'on',
    });
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? 'Invalid input',
        ok: false,
      };
    }
    const input = parsed.data;

    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
      select: { id: true, state: true },
    });
    if (!match) return { error: 'Match not found.', ok: false };
    if (match.state !== 'DRAFT') {
      return { error: 'Only draft matches can be edited.', ok: false };
    }

    await prisma.match.update({
      where: { id: input.matchId },
      data: {
        title: input.title,
        map: input.map,
        team1Name: input.team1Name,
        team2Name: input.team2Name,
        maxRounds: input.maxRounds,
        overtimeEnabled: input.overtimeEnabled,
        overtimeRounds: input.overtimeRounds,
        overtimeStartMoney: input.overtimeStartMoney,
        knifeRound: input.knifeRound,
        ...(input.clearJoinPassword
          ? { joinPasswordEnc: '' }
          : input.joinPassword
            ? { joinPasswordEnc: seal(input.joinPassword) }
            : {}),
      },
    });

    await audit(user, 'match.update', 'match', input.matchId, {
      title: input.title,
      map: input.map,
    });
    revalidateMatchLists(input.matchId);
    redirect('/admin/matches/mine');
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to edit matches.', ok: false };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      ok: false,
    };
  }
}
