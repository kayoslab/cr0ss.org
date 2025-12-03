export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { revalidateHabits } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { ZDayUpsert } from "@/lib/db/validation";
import { HTTP_STATUS } from "@/lib/constants/http";
import { RATE_LIMITS } from "@/lib/rate/config";

// GET habit data for a specific day (default: today)
export const GET = wrapTrace("GET /api/habits/day", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-day", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

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
      }, { status: HTTP_STATUS.OK });
    }

    return NextResponse.json(rows[0], { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status });
  }
});

// POST update habit data for a specific day (partial or full)
export const POST = wrapTrace("POST /api/habits/day", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-day", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const body = await req.json();
    const result = ZDayUpsert.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: result.error.flatten() },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const parsed = result.data;

    // Build dynamic SET clause - only update fields that were provided
    const updates: string[] = [];
    if (parsed.sleep_score !== undefined) updates.push('sleep_score = EXCLUDED.sleep_score');
    if (parsed.focus_minutes !== undefined) updates.push('focus_minutes = EXCLUDED.focus_minutes');
    if (parsed.steps !== undefined) updates.push('steps = EXCLUDED.steps');
    if (parsed.reading_minutes !== undefined) updates.push('reading_minutes = EXCLUDED.reading_minutes');
    if (parsed.outdoor_minutes !== undefined) updates.push('outdoor_minutes = EXCLUDED.outdoor_minutes');
    if (parsed.writing_minutes !== undefined) updates.push('writing_minutes = EXCLUDED.writing_minutes');
    if (parsed.coding_minutes !== undefined) updates.push('coding_minutes = EXCLUDED.coding_minutes');

    const setClause = updates.length > 0 ? updates.join(', ') : 'sleep_score = days.sleep_score';

    await sql/*sql*/`
      INSERT INTO days (
        date, sleep_score, focus_minutes, steps,
        reading_minutes, outdoor_minutes, writing_minutes,
        coding_minutes
      )
      VALUES (
        ${parsed.date}::date,
        ${parsed.sleep_score ?? 0}::int,
        ${parsed.focus_minutes ?? 0}::int,
        ${parsed.steps ?? 0}::int,
        ${parsed.reading_minutes ?? 0}::int,
        ${parsed.outdoor_minutes ?? 0}::int,
        ${parsed.writing_minutes ?? 0}::int,
        ${parsed.coding_minutes ?? 0}::int
      )
      ON CONFLICT (date) DO UPDATE SET ${sql.unsafe(setClause)}
    `;

    // Fetch and return the full day data after update
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
      WHERE date = ${parsed.date}::date
      LIMIT 1
    `;

    revalidateHabits();
    return NextResponse.json(rows[0], { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status });
  }
});