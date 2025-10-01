export const runtime = "edge";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";

// GET current-month goals
export async function GET(req: Request) {
  try {
    const [{ month_start }] = await sql/*sql*/`
      SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
    `;
    const rows = await sql/*sql*/`
      SELECT kind::text, target::numeric
      FROM monthly_goals
      WHERE month = ${month_start}::date
    `;

    const out: Record<string, number> = {
      running_distance_km: 0,
      steps: 0,
      reading_minutes: 0,
      outdoor_minutes: 0,
      writing_minutes: 0,
      coding_minutes: 0,
      focus_minutes: 0,
    };
    for (const r of rows as any[]) {
      const k = String(r.kind);
      const v = Number(r.target);
      if (k in out) out[k] = v;
    }
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
}

// POST update current-month goals (partial or full)
export async function POST(req: Request) {
  try {
    assertSecret(req);
    const body = await req.json();

    // upsert all known keys for the current Berlin month
    const [{ month_start }] = await sql/*sql*/`
      SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
    `;

    const known = [
      "running_distance_km",
      "steps",
      "reading_minutes",
      "outdoor_minutes",
      "writing_minutes",
      "coding_minutes",
      "focus_minutes",
    ] as const;

    for (const k of known) {
      const v = Number(body?.[k] ?? 0);
      await sql/*sql*/`
        INSERT INTO monthly_goals (month, kind, target)
        VALUES (${month_start}::date, ${k}::goal_kind, ${v}::numeric)
        ON CONFLICT (month, kind) DO UPDATE SET target = EXCLUDED.target
      `;
    }

    revalidateDashboard();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
}
