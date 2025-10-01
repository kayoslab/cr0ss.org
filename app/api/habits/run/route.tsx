export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { sql } from "@/lib/db/client";
import { ZRun } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";

export async function GET(req: Request) {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-run", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const rows = await sql/*sql*/`
      SELECT
        id,
        date::text,
        distance_km::float,
        duration_min::float,
        avg_pace_sec_per_km::int
      FROM runs
      ORDER BY date DESC
      LIMIT 50
    `;
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}

// POST add one or more new runs
export const POST = wrapTrace("POST /api/habits/run", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-run", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }
  
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZRun.parse(i));

    for (const i of parsed) {
      await sql/*sql*/`
        insert into runs (date, distance_km, duration_min, avg_pace_sec_per_km)
        values (${i.date}, ${i.distance_km}, ${i.duration_min}, ${i.avg_pace_sec_per_km ?? null});
      `;
    }

    revalidateDashboard();
    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
});
