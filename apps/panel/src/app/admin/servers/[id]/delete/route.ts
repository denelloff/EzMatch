import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { audit, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hubFetch } from '@/lib/hub';

export const runtime = 'nodejs';

/**
 * Plain HTML form POST — does not rely on React server-action plumbing.
 * Used by the Delete buttons on the server list and detail pages.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: serverId } = await context.params;
  const user = await requireRole('ADMIN');

  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true, status: true, name: true },
    });
    if (!server) {
      return redirectWithError(request, 'Server not found.');
    }

    const running = await prisma.gameInstance.count({
      where: { serverId, state: 'RUNNING' },
    });
    if (running > 0) {
      return redirectWithError(
        request,
        `Stop the ${running} running CS2 instance${running === 1 ? '' : 's'} first.`,
      );
    }

    await hubFetch(`/internal/servers/${serverId}/revoke-token`, {
      method: 'POST',
      body: {},
    }).catch(() => undefined);

    const instances = await prisma.gameInstance.findMany({
      where: { serverId },
      select: { id: true },
    });
    const instanceIds = instances.map((row) => row.id);

    if (instanceIds.length > 0) {
      const matches = await prisma.match.findMany({
        where: { instanceId: { in: instanceIds } },
        select: { id: true },
      });
      const matchIds = matches.map((row) => row.id);

      if (matchIds.length > 0) {
        await prisma.matchDemo.deleteMany({
          where: { matchId: { in: matchIds } },
        });
        await prisma.matchTransition.deleteMany({
          where: { matchId: { in: matchIds } },
        });
        await prisma.matchPlayer.deleteMany({
          where: { matchId: { in: matchIds } },
        });
        await prisma.gameEvent.updateMany({
          where: { matchId: { in: matchIds } },
          data: { matchId: null },
        });
        await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
      }

      await prisma.gameEvent.deleteMany({
        where: { instanceId: { in: instanceIds } },
      });
      await prisma.consoleLine.deleteMany({
        where: { instanceId: { in: instanceIds } },
      });
      await prisma.pluginInstall.deleteMany({
        where: { instanceId: { in: instanceIds } },
      });
      await prisma.task.updateMany({
        where: { instanceId: { in: instanceIds } },
        data: { instanceId: null },
      });
      await prisma.gameInstance.deleteMany({
        where: { id: { in: instanceIds } },
      });
    }

    await prisma.task.deleteMany({ where: { serverId } });
    await prisma.agentToken.deleteMany({ where: { serverId } });
    await prisma.server.delete({ where: { id: serverId } });

    await audit(user, 'server.delete', 'server', serverId, {
      name: server.name,
      status: server.status,
    });

    revalidatePath('/admin/servers');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error ? error.message : 'Failed to delete server.';
    return redirectWithError(request, message);
  }

  return NextResponse.redirect(new URL('/admin/servers', request.url), 303);
}

function redirectWithError(request: Request, message: string) {
  const url = new URL('/admin/servers', request.url);
  url.searchParams.set('deleteError', message);
  return NextResponse.redirect(url, 303);
}
