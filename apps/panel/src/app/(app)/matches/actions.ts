'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertRole, audit, ForbiddenError } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';
import {
  DEFAULT_FREEZETIME,
  FREEZETIME_MAX,
  FREEZETIME_MIN,
} from '@/lib/match-defaults';
import { seal } from '@/lib/secrets';

const createSchema = z.object({
  instanceId: z.string().min(1).max(64),
  title: z.string().min(1).max(80),
  team1Id: z.string().min(1).max(64).optional(),
  team2Id: z.string().min(1).max(64).optional(),
  team1Name: z.string().min(1).max(24).optional(),
  team2Name: z.string().min(1).max(24).optional(),
  map: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Map names are lowercase letters, digits and underscores'),
  maxRounds: z.coerce.number().int().min(2).max(60),
  overtimeEnabled: z.boolean(),
  overtimeRounds: z.coerce.number().int().refine((n) => n === 6 || n === 10, {
    message: 'Overtime must be MR3 (6) or MR5 (10)',
  }),
  overtimeStartMoney: z.coerce
    .number()
    .int()
    .min(0)
    .max(16_000),
  freezetime: z.coerce
    .number()
    .int()
    .min(FREEZETIME_MIN)
    .max(FREEZETIME_MAX),
  knifeRound: z.boolean(),
  joinPassword: z.string().max(64).optional(),
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
      team1Id: String(formData.get('team1Id') ?? '').trim() || undefined,
      team2Id: String(formData.get('team2Id') ?? '').trim() || undefined,
      team1Name: String(formData.get('team1Name') ?? '').trim() || undefined,
      team2Name: String(formData.get('team2Name') ?? '').trim() || undefined,
      map: formData.get('map'),
      maxRounds: formData.get('maxRounds') || 24,
      overtimeEnabled: formData.get('overtimeEnabled') === 'on',
      overtimeRounds: formData.get('overtimeRounds') || 6,
      overtimeStartMoney: formData.get('overtimeStartMoney') || 10_000,
      freezetime: formData.get('freezetime') || DEFAULT_FREEZETIME,
      knifeRound: formData.get('knifeRound') === 'on',
      joinPassword: String(formData.get('joinPassword') ?? '').trim() || undefined,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    const input = parsed.data;

    let team1Name = input.team1Name;
    let team2Name = input.team2Name;

    if (input.team1Id || input.team2Id) {
      if (!input.team1Id || !input.team2Id) {
        return { error: 'Pick both CT and T teams.' };
      }
      if (input.team1Id === input.team2Id) {
        return { error: 'CT and T must be different teams.' };
      }
      const [team1, team2] = await Promise.all([
        prisma.team.findUnique({ where: { id: input.team1Id } }),
        prisma.team.findUnique({ where: { id: input.team2Id } }),
      ]);
      if (!team1 || !team2) return { error: 'One of the selected teams was not found.' };
      // Scoreboard names stay short; tags fit mp_teamname cleanly.
      team1Name = team1.tag.slice(0, 24);
      team2Name = team2.tag.slice(0, 24);
    }

    if (!team1Name || !team2Name) {
      return { error: 'Both team names are required.' };
    }

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
        team1Name,
        team2Name,
        maxRounds: input.maxRounds,
        overtimeEnabled: input.overtimeEnabled,
        overtimeRounds: input.overtimeRounds,
        overtimeStartMoney: input.overtimeStartMoney,
        freezetime: input.freezetime,
        knifeRound: input.knifeRound,
        // The prefix scopes round backups to this match, so a restore can never
        // reach into a previous one played on the same server.
        backupPrefix: `ezmatch_${randomBytes(4).toString('hex')}`,
        joinPasswordEnc: input.joinPassword ? seal(input.joinPassword) : '',
      },
    });
    matchId = match.id;

    await audit(user, 'match.create', 'match', match.id, {
      instanceId: instance.id,
      map: input.map,
      team1Name,
      team2Name,
      team1Id: input.team1Id ?? null,
      team2Id: input.team2Id ?? null,
      overtimeRounds: input.overtimeRounds,
      overtimeStartMoney: input.overtimeStartMoney,
      freezetime: input.freezetime,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { error: 'You do not have permission to create matches.' };
    }
    return { error: error instanceof Error ? error.message : 'Unexpected error' };
  }

  redirect(`/admin/matches/mine`);
}

const actionSchema = z.object({
  matchId: z.string().min(1).max(64),
  action: z.enum([
    'prepare',
    'knife',
    'live',
    'pause',
    'unpause',
    'restore',
    'cancel',
    'restart',
    'streamers_ready',
  ]),
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
    const role =
      input.action === 'cancel' || input.action === 'restore' ? 'ADMIN' : 'OPERATOR';
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
    revalidatePath(`/admin/matches/${input.matchId}`);
    revalidatePath('/admin/matches/mine');
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

const moderateSchema = z.object({
  matchId: z.string().min(1).max(64),
  instanceId: z.string().min(1).max(64),
  steamId: z.string().min(1).max(64),
  name: z.string().min(1).max(64),
  action: z.enum(['kick', 'ban']),
});

/** Kick / ban a player from the match control scorebot. */
export async function moderateMatchPlayerAction(input: {
  matchId: string;
  instanceId: string;
  steamId: string;
  name: string;
  action: 'kick' | 'ban';
}): Promise<{ ok: boolean; error: string | null }> {
  try {
    const parsed = moderateSchema.parse(input);
    const user = await assertRole(
      parsed.action === 'ban' ? 'ADMIN' : 'OPERATOR',
    );

    const match = await prisma.match.findUnique({
      where: { id: parsed.matchId },
      select: {
        id: true,
        instanceId: true,
        players: {
          where: { steamId: parsed.steamId },
          select: { name: true, steamId: true },
          take: 1,
        },
      },
    });
    if (!match || match.instanceId !== parsed.instanceId) {
      return { ok: false, error: 'Match not found.' };
    }

    const player = match.players[0];
    if (!player) return { ok: false, error: 'Player not found on this match.' };

    const safeName = player.name.replace(/["\\]/g, '');
    const commands =
      parsed.action === 'kick'
        ? [`kick "${safeName}"`]
        : [`banid 0 ${player.steamId}`, `kick "${safeName}"`];

    await hubFetch(`/internal/instances/${parsed.instanceId}/console`, {
      method: 'POST',
      body: { commands, captureMs: 700 },
      timeoutMs: 15_000,
    });

    // Don't wait for a disconnect log line — remove them from the live board now.
    await prisma.matchPlayer.updateMany({
      where: { matchId: parsed.matchId, steamId: player.steamId },
      data: { connected: false, ready: false },
    });

    await audit(user, `match.player.${parsed.action}`, 'match', parsed.matchId, {
      steamId: player.steamId,
      name: player.name,
    });

    revalidatePath(`/admin/matches/${parsed.matchId}`);
    revalidatePath(`/admin/matches/${parsed.matchId}/control`);
    revalidatePath(`/matches/${parsed.matchId}`);
    return { ok: true, error: null };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, error: 'You do not have permission for this action.' };
    }
    if (error instanceof HubError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
