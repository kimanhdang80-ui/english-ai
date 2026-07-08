import 'server-only';

/**
 * Rate limiting (CLAUDE.md §9, §10).
 *
 * Sliding-window limiter with a pluggable store. The default store is in-memory —
 * fine for a single instance / local dev. **Production must inject a shared store**
 * (e.g. Upstash Redis) because serverless instances don't share memory; wire it via
 * `setRateLimitStore()` in Sprint 3+ once Redis is provisioned.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the current window resets. */
  reset: number;
}

export interface RateLimitStore {
  /** Record a hit for `key` and return the count within the window. */
  hit(key: string, windowMs: number): Promise<{ count: number; reset: number }>;
}

class InMemoryStore implements RateLimitStore {
  private hits = new Map<string, number[]>();

  async hit(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; reset: number }> {
    const nowMs = Date.now();
    const windowStart = nowMs - windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter(
      (t) => t > windowStart,
    );
    timestamps.push(nowMs);
    this.hits.set(key, timestamps);
    // Opportunistic cleanup to bound memory.
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) {
        if (v.every((t) => t <= windowStart)) this.hits.delete(k);
      }
    }
    const firstTimestamp = timestamps[0] ?? nowMs;
    return { count: timestamps.length, reset: firstTimestamp + windowMs };
  }
}

let store: RateLimitStore = new InMemoryStore();

/** Swap the store (e.g. Redis) — call once at startup in production. */
export function setRateLimitStore(next: RateLimitStore): void {
  store = next;
}

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Named presets for common auth actions. */
export const RATE_LIMITS = {
  LOGIN: { limit: 5, windowMs: 60_000 },
  SIGN_UP: { limit: 3, windowMs: 60_000 },
  PASSWORD_RESET: { limit: 3, windowMs: 15 * 60_000 },
  EMAIL_RESEND: { limit: 3, windowMs: 15 * 60_000 },
} as const satisfies Record<string, RateLimitOptions>;

/**
 * Check and record a hit against `key`. Returns whether the caller is within limit.
 * Compose keys as `<action>:<identifier>` (e.g. `login:1.2.3.4`).
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const { count, reset } = await store.hit(key, options.windowMs);
  return {
    success: count <= options.limit,
    limit: options.limit,
    remaining: Math.max(0, options.limit - count),
    reset,
  };
}
