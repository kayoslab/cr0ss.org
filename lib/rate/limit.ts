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
  { windowSec = 60, max = 30 }: { windowSec?: number; max?: number } = {}
): Promise<RateLimitResult> {
  const kv = getRedis();
  const id = getClientId(req);
  const key = `ratelimit:${bucket}:${id}`;
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
