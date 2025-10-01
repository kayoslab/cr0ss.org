export const runtime = "edge";

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

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
} from "@/lib/db/queries";
import { getBodyProfile } from "@/lib/user/profile";
import { modelCaffeine, estimateIntakeMgFor } from "@/lib/phys/caffeine";

const sql = neon(process.env.DATABASE_URL!);

// read current-month goals (same shape as your /api/habits/goal)
async function getGoals(): Promise<Record<string, number>> {
    const [{ month_start }] = await sql/*sql*/`
        SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
    `;
    const rows = await sql/*sql*/`
        SELECT kind::text, target::numeric
        FROM monthly_goals
        WHERE month = ${month_start}::date
    `;
    const out: Record<string, number> = {
        running_distance_km: 0, steps: 0, reading_minutes: 0, outdoor_minutes: 0,
        writing_minutes: 0, coding_minutes: 0, focus_minutes: 0,
    };
    for (const r of rows as any[]) out[r.kind] = Number(r.target);
    return out;
}

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
        berlinBounds,
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
        qBerlinTodayBounds(),
        getBodyProfile(),
        getGoals(),
    ]);

    // caffeine series (00:00–24:00 Berlin with carry-over)
    const half = body.half_life_hours ?? 5;
    const lookbackH = Math.max(24, Math.ceil(half * 4));
    const events = await qCoffeeEventsForDayWithLookback(
      berlinBounds.startISO,
      berlinBounds.endISO,
      lookbackH
    );
    const caffeineSeries = modelCaffeine(events, body, {
      startMs: Date.parse(berlinBounds.startISO),
      endMs: Date.parse(berlinBounds.endISO),
      alignToHour: true,
      gridMinutes: 60,
      halfLifeHours: body.half_life_hours ?? undefined,
    });

    // Sleep vs previous-day caffeine (60d)
    const sleepRows = await qSleepVsFocusScatter(60);
    const minDate = sleepRows.length ? new Date(sleepRows[0].date) : new Date();
    const maxDate = sleepRows.length ? new Date(sleepRows[sleepRows.length - 1].date) : new Date();
    const startRange = new Date(minDate);
    startRange.setDate(startRange.getDate() - 1);
    const startISOAll = startRange.toISOString().slice(0, 10) + "T00:00:00.000Z";
    const endISOAll = new Date(maxDate.getTime() + 24 * 3600 * 1000).toISOString();
    const rangeEvents = await qCoffeeInRange(startISOAll, endISOAll);
    const mgByDate = new Map<string, number>();
    for (const ev of rangeEvents) {
      const d = ev.time.slice(0, 10);
      const mg = estimateIntakeMgFor(ev.type, ev.amount_ml);
      mgByDate.set(d, (mgByDate.get(d) ?? 0) + mg);
    }
    const sleepPrevCaff = sleepRows
      .map((r) => {
        const d = new Date(r.date);
        d.setDate(d.getDate() - 1);
        const prevKey = d.toISOString().slice(0, 10);
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
        brewMethodsToday,          // [{ type, count }]
        coffeeOriginThisWeek: origins7d, // [{ name, value }]
        habitsToday,               // { steps, reading_minutes, ... }
        habitsConsistency: consistency, // [{ name, kept, total }]
        writingVsFocus,            // [{ date, writing_minutes, focus_minutes }]
        runningProgress,           // { target_km, total_km, delta_km, pct, month }
        paceSeries,                // [{ date, pace_sec_per_km }]
        runningHeatmap,            // [{ date, km }]
        caffeineSeries,            // [{ timeISO, intake_mg, body_mg }]
        sleepPrevCaff,             // [{ date, sleep_score, prev_caffeine_mg }]
        monthlyGoals,              // { steps, running_distance_km, reading_minutes, ... }
      },
      { status: 200 }
    );
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status });
  }
}
