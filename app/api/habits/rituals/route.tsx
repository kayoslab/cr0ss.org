export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { HeadersSecret, ZRituals } from "@/lib/db/validation";

export async function POST(req: Request) {
  try {
    HeadersSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZRituals.parse(i));

    for (const i of parsed) {
      // ensure day exists for FK
      await sql/*sql*/`insert into days (date) values (${i.date}) on conflict (date) do nothing;`;

      await sql/*sql*/`
        insert into rituals (date, reading_minutes, outdoor_minutes, writing_minutes, extras)
        values (${i.date}, ${i.reading_minutes ?? 0}, ${i.outdoor_minutes ?? 0}, ${i.writing_minutes ?? 0}, ${JSON.stringify(i.extras ?? {})}::jsonb)
        on conflict (date) do update
        set reading_minutes = excluded.reading_minutes,
            outdoor_minutes = excluded.outdoor_minutes,
            writing_minutes = excluded.writing_minutes,
            extras = excluded.extras,
            updated_at = now();
      `;
    }
    return new Response(JSON.stringify({ ok: true, upserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}