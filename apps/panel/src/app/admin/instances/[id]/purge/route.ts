import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { audit, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch } from '@/lib/hub';

export const runtime = 'nodejs';

/**
 * Force-delete a CS2 instance: agent cleans Docker, panel drops the DB row.
 * Plain form POST target — works with no client JS (CSP / failed hydration).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: instanceId } = await context.params;
  const user = await requireRole('ADMIN');

  const instance = await prisma.gameInstance.findUnique({
    where: { id: instanceId },
    select: { id: true, serverId: true, name: true, state: true },
  });
  if (!instance) {
    return redirectBack(request, null, 'Instance not found.');
  }

  try {
    await hubFetch<{ ok: boolean }>(`/internal/instances/${instanceId}/purge`, {
      method: 'POST',
      body: { removeVolume: true, createdById: user.id },
      timeoutMs: 120_000,
    });

    await audit(user, 'instance.purge', 'instance', instanceId, {
      name: instance.name,
      state: instance.state,
      serverId: instance.serverId,
    });

    revalidatePath(`/admin/servers/${instance.serverId}`);
    revalidatePath('/admin/servers');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete instance.';
    return redirectBack(request, instance.serverId, message);
  }

  return NextResponse.redirect(
    new URL(`/admin/servers/${instance.serverId}`, request.url),
    303,
  );
}

function redirectBack(
  request: Request,
  serverId: string | null,
  message: string,
) {
  const url = new URL(
    serverId ? `/admin/servers/${serverId}` : '/admin/servers',
    request.url,
  );
  url.searchParams.set('deleteError', message);
  return NextResponse.redirect(url, 303);
}
