import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { hubStream } from '@/lib/hub';

export const dynamic = 'force-dynamic';
// SSE must not be buffered or collapsed by the framework's route cache.
export const fetchCache = 'force-no-store';

const ALLOWED = new Set([
  'task',
  'console',
  'events',
  'server',
  'instance',
  'match',
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { path } = await context.params;
  const [kind, id] = path;
  if (!kind || !id || !ALLOWED.has(kind)) {
    return NextResponse.json({ error: 'unknown stream' }, { status: 404 });
  }

  const query = new URL(request.url).searchParams.toString();
  const suffix = query ? `?${query}` : '';

  return hubStream(
    `/internal/stream/${kind}/${encodeURIComponent(id)}${suffix}`,
    request.signal,
  );
}

