import { Redis } from '@upstash/redis';
import { getClientId } from './who';
import { env } from '@/env';

export type RateLimitResult =
  { ok: true } | { ok: false; retryAfterSec: number };

// The store was provisioned as Vercel KV (now Upstash Redis on the Marketplace);
// it still exposes its credentials under the KV_REST_API_* names.
let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: env.KV_REST_API_URL,
      token: env.KV_REST_API_TOKEN,
    });
  }
  return redis;
}

export async function rateLimit(
  req: Request,
  bucket: string,
  options?: { windowSec?: number; max?: number }
): Promise<RateLimitResult> {
  return consume(`ratelimit:${bucket}:${getClientId(req)}`, options);
}

/**
 * One counter shared by every caller. Per-client limits can't protect an
 * upstream quota (Algolia's free plan) from traffic spread over many IPs;
 * this caps the total no matter where it comes from.
 */
export async function globalRateLimit(
  bucket: string,
  options?: { windowSec?: number; max?: number }
): Promise<RateLimitResult> {
  return consume(`ratelimit:${bucket}:global`, options);
}

async function consume(
  key: string,
  { windowSec = 60, max = 30 }: { windowSec?: number; max?: number } = {}
): Promise<RateLimitResult> {
  const kv = getRedis();
  const tx = kv.multi();
  tx.incr(key);
  tx.ttl(key);
  const [count, ttl] = (await tx.exec()) as [number, number];

  if (typeof count !== 'number') {
    // defensive: allow request if KV hiccups
    return { ok: true };
  }
  // The window starts on the first hit and is never extended: refreshing
  // the TTL on every call (rejected ones included) kept a busy client
  // locked out for as long as it kept trying.
  if (count === 1 || ttl < 0) await kv.expire(key, windowSec);

  if (count > max) {
    const retryAfterSec = Math.max(1, ttl > 0 ? ttl : windowSec);
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}
