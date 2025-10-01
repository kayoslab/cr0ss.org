export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { ZCoffee } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";

// // GET coffee log entries (optional date range)
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const start = searchParams.get("start");
//     const end = searchParams.get("end");

//     const rows = await sql/*sql*/`
//       SELECT
//         to_char(date, 'YYYY-MM-DD') as date,
//         to_char(time at time zone 'Europe/Berlin', 'HH24:MI') as time,
//         type,
//         amount_ml,
//         coffee_cf_id
//       FROM coffee_log
//       WHERE (${start}::date IS NULL OR date >= ${start}::date)
//         AND (${end}::date IS NULL OR date <= ${end}::date)
//       ORDER BY date DESC, time DESC
//       LIMIT 1000
//     `;

//     return new Response(JSON.stringify(rows), { status: 200 });
//   } catch (e: any) {
//     return new Response(e?.message ?? "Failed", { status: e?.status ?? 500 });
//   }
// }

// POST new coffee log entry or entries (single object or array)
export async function POST(req: Request) {
  try {
    assertSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZCoffee.parse(i));

    for (const i of parsed) {
      // decide a timestamptz for "time"
      // if client sends only HH:mm, combine with date; if none, default now()
      const ts =
        i.time && /^\d{2}:\d{2}$/.test(i.time)
          ? `${i.date.toISOString().slice(0,10)}T${i.time}:00.000Z`
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
}
