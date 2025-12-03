export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { revalidateShared } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { ZMonthlyGoalsUpsert } from "@/lib/db/validation";
import { HTTP_STATUS } from "@/lib/constants/http";
import { RATE_LIMITS } from "@/lib/rate/config";

// GET current-month goals
export const GET = wrapTrace("GET /api/habits/goal", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-goal", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }
  
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
    for (const r of rows as Array<{ kind: string; target: number }>) {
      const k = String(r.kind);
      const v = Number(r.target);
      if (k in out) out[k] = v;
    }
    return NextResponse.json(out, { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status });
  }
});

// POST update current-month goals (partial or full)
export const POST = wrapTrace("POST /api/habits/goal", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-goal", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const body = await req.json();
    const result = ZMonthlyGoalsUpsert.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: result.error.flatten() },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const parsed = result.data;
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
      const v = Number(parsed?.[k] ?? 0);
      await sql/*sql*/`
        INSERT INTO monthly_goals (month, kind, target)
        VALUES (${month_start}::date, ${k}::goal_kind, ${v}::numeric)
        ON CONFLICT (month, kind) DO UPDATE SET target = EXCLUDED.target
      `;
    }

    revalidateShared();
    return NextResponse.json({ ok: true }, { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status });
  }
});