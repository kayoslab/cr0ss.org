export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { HeadersSecret, ZRun } from "@/lib/db/validation";

export async function POST(req: Request) {
  try {
    HeadersSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZRun.parse(i));

    for (const i of parsed) {
      await sql/*sql*/`
        insert into runs (date, distance_km, duration_min, avg_pace_sec_per_km)
        values (${i.date}, ${i.distance_km}, ${i.duration_min}, ${i.avg_pace_sec_per_km ?? null});
      `;
    }
    return new Response(JSON.stringify({ ok: true, inserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}