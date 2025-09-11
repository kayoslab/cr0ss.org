export const runtime = "edge";

import { sql, kv } from "@/lib/db/client";
import { HeadersSecret, ZCoffee } from "@/lib/db/validation";

export async function POST(req: Request) {
  try {
    HeadersSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZCoffee.parse(i));

    for (const i of parsed) {
      await sql/*sql*/`
        insert into coffee_log (date, type, amount_ml, caffeine_mg, tasting, notes)
        values (${i.date}, ${i.type}, ${i.amount_ml ?? null}, ${i.caffeine_mg ?? null}, ${i.tasting ?? null}, ${i.notes ?? null});
      `;
      // optional: count cups per day in KV for a fast KPI
      if (process.env.KV_REST_API_URL) {
        const dayKey = `coffee:cups:${i.date.toISOString().slice(0,10)}`;
        await kv.incr(dayKey);
      }
    }
    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}