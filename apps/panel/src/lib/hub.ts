import 'server-only';

const HUB_URL = process.env.HUB_INTERNAL_URL ?? 'http://127.0.0.1:4000';
const INTERNAL_TOKEN = process.env.HUB_INTERNAL_TOKEN ?? '';

export class HubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'HubError';
  }
}

interface HubRequestInit {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function hubFetch<T>(
  path: string,
  init: HubRequestInit = {},
): Promise<T> {
  if (!INTERNAL_TOKEN) {
    throw new HubError('HUB_INTERNAL_TOKEN is not configured', 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? 30_000,
  );
  init.signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(`${HUB_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'x-ppanel-internal': INTERNAL_TOKEN,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const detail =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error: unknown }).error)
          : response.statusText;
      throw new HubError(hubErrorMessage(response.status, detail), response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof HubError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HubError('The hub did not respond in time', 504);
    }
    throw new HubError(
      `Could not reach the hub at ${HUB_URL}. Is it running?`,
      502,
      error,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function hubErrorMessage(status: number, detail: string): string {
  if (status === 404) return 'Not found';
  if (status === 409) return detail;
  if (status === 503) return 'The agent for this server is not connected';
  return detail || `Hub returned ${status}`;
}

/** Streams an SSE endpoint from the hub straight through to the browser. */
export async function hubStream(
  path: string,
  signal: AbortSignal,
): Promise<Response> {
  const response = await fetch(`${HUB_URL}${path}`, {
    headers: { 'x-ppanel-internal': INTERNAL_TOKEN },
    signal,
    cache: 'no-store',
  });

  if (!response.ok || !response.body) {
    return new Response('stream unavailable', { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
