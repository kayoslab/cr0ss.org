export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { ZCoffee } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { normalizeHHmm, berlinDateTimeISO } from "@/lib/time/berlin";

// POST new coffee log entry or entries (single object or array)
export async function POST(req: Request) {
  try {
    assertSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZCoffee.parse(i));

    for (const i of parsed) {
      // Decide the timestamptz to store:
      // - If client sends "HH:mm", combine with date in Berlin wall-clock.
      // - If client sends a full ISO "time", trust it.
      // - Otherwise, default to now().
      let ts: string;
      if (i.time && /^\d{1,2}(:\d{1,2})?$/.test(i.time)) {
        const hhmm = normalizeHHmm(i.time);
        const ymd = i.date.toISOString().slice(0, 10); // Berlin date chosen on the client
        ts = berlinDateTimeISO(ymd, hhmm);
      } else if (i.time) {
        ts = new Date(i.time).toISOString();
      } else {
        ts = new Date().toISOString();
      }

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
