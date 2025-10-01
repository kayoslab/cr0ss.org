export const runtime = "edge";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";

// GET habit data for a specific day (default: today)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let date = searchParams.get("date");

    if (!date) {
      const [{ d }] = await sql/*sql*/`
        SELECT (date_trunc('day', timezone('Europe/Berlin', now()))::date) AS d
      `;
      date = new Date(d as string).toISOString().slice(0, 10);
    }

    const rows = await sql/*sql*/`
      SELECT
        to_char(date, 'YYYY-MM-DD') as date,
        COALESCE(sleep_score,0)::int           as sleep_score,
        COALESCE(focus_minutes,0)::int         as focus_minutes,
        COALESCE(steps,0)::int                 as steps,
        COALESCE(reading_minutes,0)::int       as reading_minutes,
        COALESCE(outdoor_minutes,0)::int       as outdoor_minutes,
        COALESCE(writing_minutes,0)::int       as writing_minutes,
        COALESCE(coding_minutes,0)::int        as coding_minutes
      FROM days
      WHERE date = ${date}::date
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({
        date,
        sleep_score: 0,
        focus_minutes: 0,
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
      }, { status: 200 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
}

// POST update habit data for a specific day (partial or full)
export async function POST(req: Request) {
  try {
    assertSecret(req);
    const body = await req.json();

    const date = String(body?.date);
    if (!date) return NextResponse.json({ message: "date required" }, { status: 400 });

    await sql/*sql*/`
      INSERT INTO days (
        date, sleep_score, focus_minutes, steps,
        reading_minutes, outdoor_minutes, writing_minutes,
        coding_minutes
      )
      VALUES (
        ${date}::date, ${body.sleep_score ?? 0}::int, ${body.focus_minutes ?? 0}::int, ${body.steps ?? 0}::int,
        ${body.reading_minutes ?? 0}::int, ${body.outdoor_minutes ?? 0}::int, ${body.writing_minutes ?? 0}::int,
        ${body.coding_minutes ?? 0}::int
      )
      ON CONFLICT (date) DO UPDATE SET
        sleep_score = EXCLUDED.sleep_score,
        focus_minutes = EXCLUDED.focus_minutes,
        steps = EXCLUDED.steps,
        reading_minutes = EXCLUDED.reading_minutes,
        outdoor_minutes = EXCLUDED.outdoor_minutes,
        writing_minutes = EXCLUDED.writing_minutes,
        coding_minutes = EXCLUDED.coding_minutes
    `;

    revalidateDashboard();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
}
