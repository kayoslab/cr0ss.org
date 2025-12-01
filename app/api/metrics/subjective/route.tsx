export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { ZSubjectiveMetrics } from "@/lib/db/validation";
import { HTTP_STATUS } from "@/lib/constants/http";
import { RATE_LIMITS } from "@/lib/rate/config";

// GET subjective metrics for a specific day (default: today)
export const GET = wrapTrace("GET /api/metrics/subjective", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-subjective-metrics", RATE_LIMITS.HABITS);
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
        mood,
        energy,
        stress,
        focus_quality,
        notes
      FROM subjective_metrics
      WHERE date = ${date}::date
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({
        date,
        mood: null,
        energy: null,
        stress: null,
        focus_quality: null,
        notes: null,
      }, { status: HTTP_STATUS.OK });
    }

    return NextResponse.json(rows[0], { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status });
  }
});

// POST update subjective metrics for a specific day (partial or full)
export const POST = wrapTrace("POST /api/metrics/subjective", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-subjective-metrics", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const body = await req.json();
    const result = ZSubjectiveMetrics.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: result.error.flatten() },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const parsed = result.data;

    // Build dynamic SET clause - only update fields that were provided
    const updates: string[] = [];
    if (parsed.mood !== undefined) updates.push('mood = EXCLUDED.mood');
    if (parsed.energy !== undefined) updates.push('energy = EXCLUDED.energy');
    if (parsed.stress !== undefined) updates.push('stress = EXCLUDED.stress');
    if (parsed.focus_quality !== undefined) updates.push('focus_quality = EXCLUDED.focus_quality');
    if (parsed.notes !== undefined) updates.push('notes = EXCLUDED.notes');

    const setClause = updates.length > 0 ? updates.join(', ') : 'mood = subjective_metrics.mood';

    await sql/*sql*/`
      INSERT INTO subjective_metrics (
        date, mood, energy, stress, focus_quality, notes
      )
      VALUES (
        ${parsed.date}::date,
        ${parsed.mood ?? null}::int,
        ${parsed.energy ?? null}::int,
        ${parsed.stress ?? null}::int,
        ${parsed.focus_quality ?? null}::int,
        ${parsed.notes ?? null}::text
      )
      ON CONFLICT (date) DO UPDATE SET ${sql.unsafe(setClause)}
    `;

    // Fetch and return the full metrics data after update
    const rows = await sql/*sql*/`
      SELECT
        to_char(date, 'YYYY-MM-DD') as date,
        mood,
        energy,
        stress,
        focus_quality,
        notes
      FROM subjective_metrics
      WHERE date = ${parsed.date}::date
      LIMIT 1
    `;

    revalidateDashboard();
    return NextResponse.json(rows[0], { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status });
  }
});
