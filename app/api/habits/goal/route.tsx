export const runtime = "edge";

import { sql } from "@/lib/db/client";
import { HeadersSecret, ZGoal } from "@/lib/db/validation";

export async function POST(req: Request) {
  try {
    HeadersSecret(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((i) => ZGoal.parse(i));

    for (const i of parsed) {
      // normalize month to first of month
      const m = new Date(i.month); m.setDate(1); m.setHours(0,0,0,0);
      await sql/*sql*/`
        insert into monthly_goals (month, kind, target)
        values (${m}, ${i.kind}, ${i.target})
        on conflict (month, kind) do update
        set target = excluded.target;
      `;
    }
    return new Response(JSON.stringify({ ok: true, upserted: parsed.length }), { status: 200 });
  } catch (err: any) {
    return new Response(err?.message ?? "Bad Request", { status: err?.status ?? 400 });
  }
}