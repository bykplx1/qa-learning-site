/**
 * Postgres-backed sliding-window rate limiter for custom write endpoints.
 *
 * Shares the `rate_limits` table that better-auth uses for its own auth
 * endpoints (storage: "database"), so no extra dependency is needed.
 *
 * Key: "<userId|ip>:<route>" — distinct per principal + endpoint.
 * Window: fixed sliding window (count resets when lastRequest is outside the window).
 *
 * Server-only — never import from client:* islands.
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { rateLimits } from '../../db/schema';

export interface RateLimitOptions {
  /** Window length in seconds. */
  windowSec: number;
  /** Max requests allowed per window. */
  max: number;
}

export interface RateLimitResult {
  limited: boolean;
  /** Seconds until the window resets (only set when limited === true). */
  retryAfter?: number;
}

/**
 * Build the composite key for a principal + route pair.
 * Prefers authenticated user id; falls back to IP address.
 */
export function buildKey(route: string, userId: string | null | undefined, ip: string | null | undefined): string {
  const principal = userId ?? ip ?? 'unknown';
  return `${principal}:${route}`;
}

/**
 * Extract the best available client IP from a Request.
 * Checks Vercel/Cloudflare forwarded headers before falling back to a placeholder.
 */
export function getClientIp(request: Request): string | null {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  );
}

/**
 * Check and increment the rate-limit counter for the given key.
 *
 * Returns `{ limited: false }` when under the limit (and records the hit),
 * or `{ limited: true, retryAfter }` when the window is exhausted.
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;

  const [existing] = await db
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.key, key))
    .limit(1);

  if (!existing) {
    // First request in this window — insert a fresh row.
    await db
      .insert(rateLimits)
      .values({ key, count: 1, lastRequest: now })
      .onConflictDoNothing();
    return { limited: false };
  }

  const windowExpired = now - existing.lastRequest >= windowMs;

  if (windowExpired) {
    // Window has rolled over — reset count.
    await db
      .update(rateLimits)
      .set({ count: 1, lastRequest: now })
      .where(eq(rateLimits.key, key));
    return { limited: false };
  }

  if (existing.count >= opts.max) {
    const retryAfter = Math.ceil((existing.lastRequest + windowMs - now) / 1000);
    return { limited: true, retryAfter };
  }

  // Within window, under limit — increment.
  await db
    .update(rateLimits)
    .set({ count: existing.count + 1, lastRequest: now })
    .where(eq(rateLimits.key, key));

  return { limited: false };
}

/**
 * Build a 429 Response with the Retry-After header.
 */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  );
}
