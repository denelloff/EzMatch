import 'server-only';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * In-process fixed-window limiter. Enough to blunt password guessing against a
 * single-instance panel; a multi-instance deployment needs a shared store.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

// Without this the map grows once per distinct key and never shrinks.
const CLEANUP_INTERVAL_MS = 60_000;
const timer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
timer.unref?.();

