export const runtime = "edge";

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import {
  startOfBerlinDayISO,
  endOfBerlinDayISO,
  prevBerlinDateKey,
} from "@/lib/time/berlin";

import {
  qBerlinTodayBounds,
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

const sql = neon(process.env.DATABASE_URL!);
const startISO = startOfBerlinDayISO();
const endISO   = endOfBerlinDayISO();

export async function GET(req: Request) {
  try {
    // parallelize where safe
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
        body,
        monthlyGoals,
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
        qMonthlyGoalsObject(),
    ]);

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
      const ymd = new Date(ev.time).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
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

    return NextResponse.json(
      {
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
      }, { 
        status: 200 
      }
    );
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
}
