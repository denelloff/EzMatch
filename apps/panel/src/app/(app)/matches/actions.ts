'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';

const createSchema = z.object({
  instanceId: z.string().min(1).max(64),
  title: z.string().min(1).max(80),
  team1Name: z.string().min(1).max(24),
  team2Name: z.string().min(1).max(24),
  map: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Map names are lowercase letters, digits and underscores'),
  maxRounds: z.coerce.number().int().min(2).max(60),
  overtimeEnabled: z.boolean(),
  overtimeRounds: z.coerce.number().int().min(2).max(12),
  knifeRound: z.boolean(),
});

export interface CreateMatchState {
  error: string | null;
}

export async function createMatchAction(
  _prev: CreateMatchState,
  formData: FormData,
): Promise<CreateMatchState> {
  let matchId: string;

  try {
    const user = await assertRole('OPERATOR');

    const parsed = createSchema.safeParse({
      instanceId: formData.get('instanceId'),
      title: formData.get('title'),
      team1Name: formData.get('team1Name'),
      team2Name: formData.get('team2Name'),
      map: formData.get('map'),
      maxRounds: formData.get('maxRounds') || 24,
      overtimeEnabled: formData.get('overtimeEnabled') === 'on',
      overtimeRounds: formData.get('overtimeRounds') || 6,
      knifeRound: formData.get('knifeRound') === 'on',
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const input = parsed.data;

    const instance = await prisma.gameInstance.findUnique({
      where: { id: input.instanceId },
      select: { id: true, state: true },
    });
    if (!instance) return { error: 'Instance not found.' };
    if (instance.state !== 'RUNNING') {
      return { error: 'Start the CS2 server before creating a match.' };
    }

    const running = await prisma.match.findFirst({
      where: {
        instanceId: instance.id,
        state: { notIn: ['FINISHED', 'CANCELLED'] },
      },
    });
    if (running) {
      return {
        error: `"${running.title}" is still open on this server. Finish or cancel it first.`,
      };
    }

    const match = await prisma.match.create({
      data: {
        instanceId: instance.id,
        title: input.title,
        map: input.map,
        team1Name: input.team1Name,
        team2Name: input.team2Name,
        maxRounds: input.maxRounds,
        overtimeEnabled: input.overtimeEnabled,
        overtimeRounds: input.overtimeRounds,
        knifeRound: input.knifeRound,
        // The prefix scopes round backups to this match, so a restore can never
        // reach into a previous one played on the same server.
        backupPrefix: `ppanel_${randomBytes(4).toString('hex')}`,
      },
    });
    matchId = match.id;

    await audit(user, 'match.create', 'match', match.id, {
      instanceId: instance.id,
      map: input.map,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to create matches.' };
    }
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }

  redirect(`/matches/${matchId}`);
}

const actionSchema = z.object({
  matchId: z.string().min(1).max(64),
  action: z.enum(['prepare', 'knife', 'live', 'pause', 'unpause', 'restore', 'cancel']),
  choice: z.enum(['stay', 'swap']).optional(),
  file: z.string().max(128).optional(),
});

export interface MatchActionState {
  error: string | null;
  ok: boolean;
}

export async function matchAction(
  _prev: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  try {
    const [action, choice] = String(formData.get('action') ?? '').split(':');
    const input = actionSchema.parse({
      matchId: formData.get('matchId'),
      action,
      choice: choice || undefined,
      file: formData.get('file') || undefined,
    });

    // Cancelling throws away a match in progress, and restoring rewrites the
    // score; both are more than an operator-level action.
    const role = input.action === 'cancel' || input.action === 'restore' ? 'ADMIN' : 'OPERATOR';
    const user = await assertRole(role);

    await hubFetch(`/internal/matches/${input.matchId}/action`, {
      method: 'POST',
      body: {
        action: input.action,
        ...(input.choice ? { choice: input.choice } : {}),
        ...(input.file ? { file: input.file } : {}),
      },
      timeoutMs: 30_000,
    });

    await audit(user, `match.${input.action}`, 'match', input.matchId, {
      choice: input.choice ?? null,
      file: input.file ?? null,
    });

    revalidatePath(`/matches/${input.matchId}`);
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission for this action.', ok: false };
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

export async function syncDemosAction(
  _prev: { error: string | null; indexed: number | null },
  formData: FormData,
): Promise<{ error: string | null; indexed: number | null }> {
  const matchId = String(formData.get('matchId') ?? '');

  try {
    const user = await assertRole('OPERATOR');
    const response = await hubFetch<{ indexed: number }>(
      `/internal/matches/${matchId}/demos/sync`,
      { method: 'POST', timeoutMs: 30_000 },
    );

    await audit(user, 'match.demos.sync', 'match', matchId, {
      indexed: response.indexed,
    });

    revalidatePath(`/matches/${matchId}/demos`);
    return { error: null, indexed: response.indexed };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to index demos.', indexed: null };
    }
    return {
      error: error instanceof Error ? error.message : 'Unexpected error',
      indexed: null,
    };
  }
}

export async function listBackupsAction(
  matchId: string,
): Promise<{ files: string[]; error: string | null }> {
  try {
    await assertRole('ADMIN');
    const response = await hubFetch<{ files: string[] }>(
      `/internal/matches/${matchId}/backups`,
      { timeoutMs: 20_000 },
    );
    return { files: response.files, error: null };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { files: [], error: 'You do not have permission to restore rounds.' };
    }
    return {
      files: [],
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
