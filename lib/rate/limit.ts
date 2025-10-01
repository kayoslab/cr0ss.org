import { kv } from "@vercel/kv";
import { getClientId } from "./who";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export async function rateLimit(
  req: Request,
  bucket: string,
  {
    windowSec = 60,
    max = 30,
  }: { windowSec?: number; max?: number } = {}
): Promise<RateLimitResult> {
  const id = getClientId(req);
  const key = `ratelimit:${bucket}:${id}`;
  const tx = kv.multi();
  tx.incr(key);
  tx.expire(key, windowSec);
  const [count] = (await tx.exec()) as [number, unknown];

  if (typeof count !== "number") {
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
