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
      SELECT kind::text, target::numeric, period::text
      FROM monthly_goals
      WHERE month = ${month_start}::date
    `;

    const out: Record<string, { target: number; period: string }> = {
      running_distance_km: { target: 0, period: 'monthly' },
      steps: { target: 0, period: 'daily' },
      reading_minutes: { target: 0, period: 'daily' },
      outdoor_minutes: { target: 0, period: 'daily' },
      writing_minutes: { target: 0, period: 'daily' },
      coding_minutes: { target: 0, period: 'daily' },
      focus_minutes: { target: 0, period: 'daily' },
    };
    for (const r of rows as Array<{ kind: string; target: number; period: string }>) {
      const k = String(r.kind);
      const v = Number(r.target);
      const p = String(r.period);
      if (k in out) out[k] = { target: v, period: p };
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

    const allGoalKinds = [
      "running_distance_km",
      "steps",
      "reading_minutes",
      "outdoor_minutes",
      "writing_minutes",
      "coding_minutes",
      "focus_minutes",
    ] as const;

    // Insert all goals with their respective periods
    for (const k of allGoalKinds) {
      const goalData = parsed?.[k];
      if (goalData !== undefined) {
        // Handle both old format (number) and new format (object with target and period)
        let target: number;
        let period: string;

        if (typeof goalData === 'object' && goalData !== null && 'target' in goalData && 'period' in goalData) {
          target = Number(goalData.target);
          period = String(goalData.period);
        } else {
          // Fallback for old format or simple number
          target = Number(goalData);
          // Default period based on kind (for backward compatibility)
          period = k === 'running_distance_km' ? 'monthly' : 'daily';
        }

        await sql/*sql*/`
          INSERT INTO monthly_goals (month, kind, target, period)
          VALUES (${month_start}::date, ${k}::goal_kind, ${target}::numeric, ${period}::goal_period)
          ON CONFLICT (month, kind) DO UPDATE SET target = EXCLUDED.target, period = EXCLUDED.period
        `;
      }
    }

    revalidateShared();
    return NextResponse.json({ ok: true }, { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status });
  }
});