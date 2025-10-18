export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { NextResponse } from "next/server";
import { ZDashboard } from "@/lib/api/dashboard";

import {
  startOfBerlinDayISO,
  endOfBerlinDayISO,
  prevBerlinDateKey,
  toBerlinYMD
} from "@/lib/time/berlin";

import {
  qCoffeeEventsForDayWithLookback,
  qCoffeeInRange,
  qSleepVsFocusScatter,
  qBrewMethodsToday,
  qCupsToday,
  qCoffeeOriginThisWeek,
  qHabitsToday,
  qHabitConsistencyThisWeek,
  qWritingVsFocusTrend,
  qRunningMonthlyProgress,
  qPaceLastRuns,
  qRunningHeatmap,
  qMonthlyGoalsObject,
} from "@/lib/db/queries";
import { getBodyProfile } from "@/lib/user/profile";
import { modelCaffeine, estimateIntakeMgFor } from "@/lib/phys/caffeine";
import { assertSecret } from "@/lib/auth/secret";

// Helper to slice events for a given window (inclusive start, exclusive end)
function eventsBetween(events: Array<{ time: string, type: string, amount_ml: number }>, startISO: string, endISO: string) {
  const s = Date.parse(startISO);
  const e = Date.parse(endISO);
  return events.filter((ev) => {
    const t = Date.parse(ev.time);
    return t >= s && t < e;
  }).map((ev) => ({
    timeISO: ev.time,       // modelCaffeine expects { timeISO, type, amount_ml }
    type: ev.type,
    amount_ml: ev.amount_ml,
  }));
}

export const GET = wrapTrace("GET /api/dashboard", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-dashboard", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const [
        cupsToday,
        brewMethodsToday,
        origins7d,
        habitsToday,
        consistency,
        writingVsFocus,
        runningProgress,
        paceSeries,
        runningHeatmap,
        body,,
    ] = await Promise.all([
        qCupsToday(),
        qBrewMethodsToday(),
        qCoffeeOriginThisWeek(),
        qHabitsToday(),
        qHabitConsistencyThisWeek(),
        qWritingVsFocusTrend(14),
        qRunningMonthlyProgress(),
        qPaceLastRuns(10),
        qRunningHeatmap(42),
        getBodyProfile(),
    ]);

    // Caffeine model for today (00:00-24:00 Berlin time + lookback for decay calculation):
    const startISO = startOfBerlinDayISO();  // Today 00:00 Berlin (in UTC)
    const endISO   = endOfBerlinDayISO();    // Tomorrow 00:00 Berlin (in UTC)
    const half = body.half_life_hours ?? 5;
    const lookbackH = Math.max(24, Math.ceil(half * 4));
    const lookbackMs = lookbackH * 60 * 60 * 1000;
    const events = await qCoffeeEventsForDayWithLookback(startISO, endISO, lookbackH);
    const caffeineSeries = modelCaffeine(events, body, {
      startMs: Date.parse(startISO),
      endMs: Date.parse(endISO),
      alignToHour: true,  // Align grid points to Berlin hour boundaries
      gridMinutes: 60,
      halfLifeHours: body.half_life_hours ?? undefined,
    });

    // --- Sleep vs previous-day caffeine (modeled carryover at midnight, 60d)
    const sleepRows = await qSleepVsFocusScatter(60); // [{date, sleep_score, focus_minutes}]
    const minYMD = sleepRows.length ? sleepRows[0].date : new Date().toISOString().slice(0, 10);
    const maxYMD = sleepRows.length ? sleepRows[sleepRows.length - 1].date : minYMD;

    // Build a single range that covers: (earliest prev-day start - lookback) .. (latest day end)
    const earliestPrevStartISO = startOfBerlinDayISO(
      // previous calendar day of the first sleep date
      new Date(`${prevBerlinDateKey(minYMD)}T00:00:00.000Z`)
    );
    const globalStartISO = new Date(Date.parse(earliestPrevStartISO) - lookbackMs).toISOString();
    const globalEndISO = endOfBerlinDayISO(new Date(`${maxYMD}T00:00:00.000Z`)); // end of the last sleep day

    // Fetch all coffee events once in that range (raw UTC ISO instants)
    const allEventsInRange = await qCoffeeInRange(globalStartISO, globalEndISO);

    const sleepPrevCaff = sleepRows
  .map((row) => {
    const prevYMD = prevBerlinDateKey(row.date);
    const prevStartISO = startOfBerlinDayISO(new Date(`${prevYMD}T00:00:00.000Z`));
    const prevEndISO   = endOfBerlinDayISO(new Date(`${prevYMD}T00:00:00.000Z`));

    const windowStartISO = new Date(Date.parse(prevStartISO) - lookbackMs).toISOString();
    const windowEndISO   = prevEndISO;

    const evs = eventsBetween(allEventsInRange, windowStartISO, windowEndISO);

    const series = modelCaffeine(evs, body, {
      startMs: Date.parse(prevStartISO),
      endMs:   Date.parse(prevEndISO),
      alignToHour: true,
      gridMinutes: 60,
      halfLifeHours: body.half_life_hours ?? undefined,
    });

    const last = series.length ? series[series.length - 1] : { body_mg: 0 };

    return {
      date: row.date,
      sleep_score: row.sleep_score,
      prev_caffeine_mg: Math.round(last.body_mg),
    };
  })
  .filter((p) => !(p.prev_caffeine_mg === 0 && (!p.sleep_score || p.sleep_score === 0)));

    
    const monthlyGoals = {
      running_distance_km: 0,
      steps: 0,
      reading_minutes: 0,
      outdoor_minutes: 0,
      writing_minutes: 0,
      coding_minutes: 0,
      focus_minutes: 0,
      ...(await qMonthlyGoalsObject()),
    };

    const payload = {
      cupsToday,
      brewMethodsToday,
      coffeeOriginThisWeek: origins7d,
      habitsToday,
      habitsConsistency: consistency,
      writingVsFocus,
      runningProgress,
      paceSeries,
      runningHeatmap,
      caffeineSeries,
      sleepPrevCaff,
      monthlyGoals,
    };

    const parsed = ZDashboard.safeParse(payload);
    if (!parsed.success) {
      console.error("[/api/dashboard] schema validation failed", parsed.error.flatten());
      return NextResponse.json({ message: "Schema validation failed" }, { status: 500 });
    }

    return NextResponse.json(parsed.data, { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
});
