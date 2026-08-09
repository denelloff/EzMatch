import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { audit, requireRole } from '@/lib/auth';
import { hubFetch } from '@/lib/hub';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await requireRole('ADMIN');

  try {
    await hubFetch(`/internal/servers/${id}/revoke-token`, {
      method: 'POST',
      body: {},
    });
    await audit(user, 'server.revokeToken', 'server', id);
    revalidatePath(`/admin/servers/${id}`);
    revalidatePath('/admin/servers');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error ? error.message : 'Failed to revoke token.';
    const url = new URL(`/admin/servers/${id}`, request.url);
    url.searchParams.set('deleteError', message);
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.redirect(new URL(`/admin/servers/${id}`, request.url), 303);
}

