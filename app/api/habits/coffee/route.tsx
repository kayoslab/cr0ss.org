export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { HeadersSecret } from "@/lib/db/validation"; // your secret check
import { ZCoffee } from "@/lib/db/validation";
import { revalidateDashboard } from "@/lib/cache/revalidate";

export async function POST(req: Request) {
  try {
    HeadersSecret(req);
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
        INSERT INTO coffee_log (date, time, type, coffee_cf_id)
        VALUES (${i.date}, ${ts}::timestamptz, ${i.type}, ${i.coffee_cf_id ?? null})
      `;
    }

    revalidateDashboard();
    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}
