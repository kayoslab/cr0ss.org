// app/api/habits/coffee/route.ts
export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { ZCoffee } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { normalizeHHmm } from "@/lib/time/berlin";

// POST new coffee log entry or entries (single object or array)
export async function POST(req: Request) {
  try {
    assertSecret(req);

    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZCoffee.parse(i));

    for (const i of parsed) {
      // i.date comes from Zod — in your current schema it's a Date (you call toISOString() on it)
      const dateStr = i.date.toISOString().slice(0, 10); // YYYY-MM-DD

      // Build a timestamptz for "time"
      // - If client sent "HH:mm", normalize to 24h and combine with date (assume UTC storage).
      // - If client sent an ISO-ish timestamp, use it directly.
      // - Else default to "now()".
      let tsISO: string;
      if (typeof i.time === "string" && /^\d{1,2}:?\d{0,2}$/.test(i.time)) {
        const hhmm = normalizeHHmm(i.time); // "HH:mm"
        tsISO = `${dateStr}T${hhmm}:00.000Z`;
      } else if (i.time) {
        // Accept Date or ISO string
        const dt = new Date(i.time as any);
        tsISO = dt.toISOString();
      } else {
        tsISO = new Date().toISOString();
      }

      await sql/*sql*/`
        INSERT INTO coffee_log (date, time, type, amount_ml, coffee_cf_id)
        VALUES (${i.date}, ${tsISO}::timestamptz, ${i.type}, ${i.amount_ml ?? null}, ${i.coffee_cf_id ?? null})
      `;
    }

    // Revalidate dashboard caches
    revalidateDashboard();

    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}

// GET recent coffee log entries (up to 50)
export async function GET() {
  try {
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
