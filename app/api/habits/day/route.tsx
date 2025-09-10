export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { HeadersSecret, ZDay } from "@/lib/db/validation";

export async function POST(req: Request) {
  try {
    HeadersSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZDay.parse(i));

    // upsert per date
    for (const i of parsed) {
      await sql/*sql*/`
        insert into days (date, sleep_score, focus_minutes)
        values (${i.date}, ${i.sleep_score}, ${i.focus_minutes})
        on conflict (date) do update
        set sleep_score = excluded.sleep_score,
            focus_minutes = excluded.focus_minutes,
            updated_at = now();
      `;
    }
    return new Response(JSON.stringify({ ok: true, upserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    const status = err?.status ?? 400;
    return new Response(err?.message ?? "Bad Request", { status });
  }
}
