import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { audit, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch, HubError } from '@/lib/hub';

export const runtime = 'nodejs';

/**
 * Plain form POST — updates the agent image without SSH when the agent is online.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: serverId } = await context.params;
  const user = await requireRole('ADMIN');

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { id: true, name: true, status: true },
  });
  if (!server) {
    return redirectWithError(request, '/admin/servers', 'Server not found.');
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
    return NextResponse.redirect(
      new URL(`/admin/servers/${serverId}?task=${response.taskId}`, request.url),
      303,
    );
  } catch (error) {
    const message =
      error instanceof HubError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Failed to start agent update.';
    return redirectWithError(request, `/admin/servers/${serverId}`, message);
  }
}

function redirectWithError(request: Request, path: string, message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set('deleteError', message);
  return NextResponse.redirect(url, 303);
}
