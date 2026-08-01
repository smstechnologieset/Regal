/**
 * Simple in-memory per-IP rate limiter.
 *
 * The app runs as a single long-lived Node process (custom server.ts), so a
 * module-level Map is a reasonable fixed-window limiter for abuse protection on
 * public endpoints. It is NOT a distributed limiter — if the app is ever scaled
 * horizontally, swap this for a shared store (e.g. Upstash/Redis).
 */

import { NextRequest, NextResponse } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so the Map doesn't grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Best-effort client IP extraction from proxy headers, falling back to a
 * constant so the limiter still applies (globally) when no IP is available.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Fixed-window rate limit check.
 * @param key    Unique key (typically `${routeName}:${ip}`).
 * @param limit  Max requests allowed within the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Convenience helper for route handlers. Returns a 429 NextResponse when the
 * caller has exceeded the limit, or `null` when the request may proceed.
 */
export function enforceRateLimit(
  request: NextRequest | Request,
  routeName: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(request);
  const { allowed, resetAt } = rateLimit(`${routeName}:${ip}`, limit, windowMs);
  if (allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
