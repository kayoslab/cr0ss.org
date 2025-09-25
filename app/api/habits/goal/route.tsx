export const runtime = "edge";

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

function assertSecret(req: Request) {
  const secret = new Headers(req.headers).get("x-vercel-revalidation-key");
  if (secret !== process.env.DASHBOARD_API_SECRET) {
    throw new Response(JSON.stringify({ message: "Invalid secret" }), { status: 401 });
  }
}

// GET current-month goals (Berlin month)
export async function GET(req: Request) {
  try {
    assertSecret(req);

    // Compute the first day of the current month in Europe/Berlin
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
