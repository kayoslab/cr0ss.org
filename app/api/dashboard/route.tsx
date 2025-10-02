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

    const startISO = startOfBerlinDayISO();
    const endISO   = endOfBerlinDayISO();

    // caffeine model:
    const half = body.half_life_hours ?? 5;
    const lookbackH = Math.max(24, Math.ceil(half * 4));
    const events = await qCoffeeEventsForDayWithLookback(startISO, endISO, lookbackH);
    const caffeineSeries = modelCaffeine(events, body, {
      startMs: Date.parse(startISO),
      endMs: Date.parse(endISO),
      alignToHour: true,
      gridMinutes: 60,
      halfLifeHours: body.half_life_hours ?? undefined,
    });

    // sleep vs previous day caffeine (60d):
    const sleepRows = await qSleepVsFocusScatter(60);
    // Pull range once using first/last sleep row, but convert prev-day keys via helper:
    const minYMD = sleepRows.length ? sleepRows[0].date : new Date().toISOString().slice(0,10);
    const maxYMD = sleepRows.length ? sleepRows[sleepRows.length-1].date : minYMD;

    // Build a single fetch range in ISO:
    const startISOAll = startOfBerlinDayISO(new Date(`${minYMD}T00:00:00.000Z`)); // includes prev-day overlap via lookback if you want
    const endISOAll   = endOfBerlinDayISO(new Date(`${maxYMD}T00:00:00.000Z`));

    const rangeEvents = await qCoffeeInRange(startISOAll, endISOAll);
    // sum by Berlin calendar date:
    const mgByDate = new Map<string, number>();
    for (const ev of rangeEvents) {
      // each ev.time is ISO; bucket by Berlin date:
      const ymd = toBerlinYMD(new Date(ev.time));

      mgByDate.set(ymd, (mgByDate.get(ymd) ?? 0) + estimateIntakeMgFor(ev.type, ev.amount_ml));
    }
    const sleepPrevCaff = sleepRows
      .map((r) => {
        const prevKey = prevBerlinDateKey(r.date);
        return {
          date: r.date,
          sleep_score: r.sleep_score,
          prev_caffeine_mg: Math.round(mgByDate.get(prevKey) ?? 0),
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
