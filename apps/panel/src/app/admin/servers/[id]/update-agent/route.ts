import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { audit, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';

export const runtime = 'nodejs';

/**
 * Plain form POST — updates the agent image without SSH when the agent is online.
 * Relative Location headers so reverse proxies (pm.denello.ru) are not bounced
 * onto localhost via request.url.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: serverId } = await context.params;
  const user = await requireRole('ADMIN');
  const wantsJson = request.headers.get('accept')?.includes('application/json');

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { id: true, name: true, status: true },
  });
  if (!server) {
    if (wantsJson) {
      return NextResponse.json({ error: 'Server not found.' }, { status: 404 });
    }
    return redirectWithError('/admin/servers', 'Server not found.');
  }

  try {
    const response = await hubFetch<{ taskId: string }>(
      `/internal/servers/${serverId}/update-agent`,
      {
        method: 'POST',
        body: { createdById: user.id },
        timeoutMs: 30_000,
      },
    );

    await audit(user, 'server.agentUpdate', 'server', serverId, {
      name: server.name,
    });

    revalidatePath(`/admin/servers/${serverId}`);

    if (wantsJson) {
      return NextResponse.json({ taskId: response.taskId });
    }

    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: `/admin/servers/${serverId}?task=${response.taskId}`,
      },
    });
  } catch (error) {
    const message =
      error instanceof HubError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Failed to start agent update.';
    if (wantsJson) {
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return redirectWithError(`/admin/servers/${serverId}`, message);
  }
}

function redirectWithError(path: string, message: string) {
  const sep = path.includes('?') ? '&' : '?';
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: `${path}${sep}deleteError=${encodeURIComponent(message)}`,
    },
  });
}
