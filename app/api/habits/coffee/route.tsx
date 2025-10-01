export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { sql } from "@/lib/db/client";
import { ZCoffee } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { normalizeBerlinHHmm } from "@/lib/time/berlin";

// GET recent coffee log entries (up to 50)
export async function GET(req: Request) {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-coffee", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const rows = await sql/*sql*/`
      SELECT id,
             date::text,
             to_char(time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS time_iso,
             type::text,
             amount_ml::numeric,
             coffee_cf_id
      FROM coffee_log
      ORDER BY date DESC, time DESC
      LIMIT 50
    `;
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ message: "Failed" }), { status: 500 });
  }
}

// POST new coffee log entry or entries (single object or array)
export const POST = wrapTrace("POST /api/habits/coffee", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-coffee", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZCoffee.parse(i));

    for (const i of parsed) {
      const dateKey = i.date.toISOString().slice(0,10);
      const ts =
        i.time && /^\d{1,2}:?\d{0,2}$/.test(i.time)
          ? `${dateKey}T${normalizeBerlinHHmm(i.time)}:00.000Z`
          : (i.time ?? new Date().toISOString());

      await sql/*sql*/`
        INSERT INTO coffee_log (date, time, type, amount_ml, coffee_cf_id)
        VALUES (${i.date}, ${ts}::timestamptz, ${i.type}, ${i.amount_ml ?? null}, ${i.coffee_cf_id ?? null})
      `;
    }

    revalidateDashboard();
    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
});