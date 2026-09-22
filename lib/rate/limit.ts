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
  tx.expire(key, windowSec);
  const [count] = (await tx.exec()) as [number, unknown];

  if (typeof count !== 'number') {
    // defensive: allow request if KV hiccups
    return { ok: true };
  }
  if (count > max) {
    // best-effort remaining TTL
    const ttl = await kv.ttl(key);
    const retryAfterSec = Math.max(1, ttl ?? windowSec);
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}
