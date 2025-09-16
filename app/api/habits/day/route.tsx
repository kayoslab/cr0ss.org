// app/api/day/route.ts
export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { HeadersSecret, ZDay } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";

export async function POST(req: Request) {
  try {
    HeadersSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZDay.parse(i));

    for (const i of parsed) {
      await sql/*sql*/`
        insert into days (
          date, sleep_score, focus_minutes, steps,
          reading_minutes, outdoor_minutes, writing_minutes, coding_minutes,
          journaled, extras
        )
        values (
          ${i.date}, ${i.sleep_score ?? null}, ${i.focus_minutes ?? 0}, ${i.steps ?? 0},
          ${i.reading_minutes ?? 0}, ${i.outdoor_minutes ?? 0}, ${i.writing_minutes ?? 0}, ${i.coding_minutes ?? 0},
          ${i.journaled ?? false}, ${JSON.stringify(i.extras ?? {})}::jsonb
        )
        on conflict (date) do update set
          sleep_score     = COALESCE(excluded.sleep_score, days.sleep_score),
          focus_minutes   = COALESCE(excluded.focus_minutes, days.focus_minutes),
          steps           = GREATEST(excluded.steps, days.steps),
          reading_minutes = GREATEST(excluded.reading_minutes, days.reading_minutes),
          outdoor_minutes = GREATEST(excluded.outdoor_minutes, days.outdoor_minutes),
          writing_minutes = GREATEST(excluded.writing_minutes, days.writing_minutes),
          coding_minutes  = GREATEST(excluded.coding_minutes, days.coding_minutes),
          journaled       = excluded.journaled OR days.journaled,
          extras          = days.extras || excluded.extras,
          updated_at      = now();
      `;
    }

    revalidateDashboard();

    return new Response(JSON.stringify({ ok: true, upserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}
