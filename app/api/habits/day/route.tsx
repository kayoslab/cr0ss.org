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

// GET /api/habits/day?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    assertSecret(req);

    const { searchParams } = new URL(req.url);
    let date = searchParams.get("date");

    // Default to "today" in Berlin if date not provided
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
        COALESCE(coding_minutes,0)::int        as coding_minutes,
        COALESCE(journaled,false)::bool        as journaled
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
        journaled: false,
      }, { status: 200 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
}
