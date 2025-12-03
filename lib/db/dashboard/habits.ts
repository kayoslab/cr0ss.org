/**
 * Habits dashboard data
 *
 * Habits tracking, productivity metrics, and sleep/caffeine correlation
 */

import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_KEYS } from "@/lib/constants/cache";
import { startOfBerlinDayISO, endOfBerlinDayISO, prevBerlinDateKey } from "@/lib/time/berlin";
import {
  qHabitConsistencyThisWeek,
  qHabitStreaks,
  qWritingVsFocusTrend,
  qSleepVsFocusScatter,
  qCoffeeInRange,
} from "@/lib/db/queries";
import { getBodyProfile } from "@/lib/user/profile";
import { sql } from "@/lib/db/client";

// Helper to slice events for a given window (inclusive start, exclusive end)
function eventsBetween(
  events: Array<{ time: string; type: string; amount_ml: number }>,
  startISO: string,
  endISO: string
) {
  const s = Date.parse(startISO);
  const e = Date.parse(endISO);
  return events
    .filter((ev) => {
      const t = Date.parse(ev.time);
      return t >= s && t < e;
    })
    .map((ev) => ({
      timeISO: ev.time,
      type: ev.type,
      amount_ml: ev.amount_ml,
    }));
}

/**
 * Get habits-specific dashboard data
 * Cached separately with HABITS tag
 */
export const getHabitsDashboardData = unstable_cache(
  async () => {
    const [
      consistency,
      habitStreaks,
      writingVsFocus,
      body,
    ] = await Promise.all([
      qHabitConsistencyThisWeek(),
      qHabitStreaks(),
      qWritingVsFocusTrend(14),
      getBodyProfile(),
    ]);

    // --- Sleep vs previous-day caffeine (modeled carryover at midnight, 60d)
    const sleepRows = await qSleepVsFocusScatter(60); // [{date, sleep_score, focus_minutes}]
    const minYMD = sleepRows.length
      ? sleepRows[0].date
      : new Date().toISOString().slice(0, 10);
    const maxYMD = sleepRows.length
      ? sleepRows[sleepRows.length - 1].date
      : minYMD;

    // Build a single range that covers: (earliest prev-day start - lookback) .. (latest day end)
    const half = body.half_life_hours ?? 5;
    const lookbackH = Math.max(24, Math.ceil(half * 4));
    const lookbackMs = lookbackH * 60 * 60 * 1000;

    const earliestPrevStartISO = startOfBerlinDayISO(
      // previous calendar day of the first sleep date
      new Date(`${prevBerlinDateKey(minYMD)}T00:00:00.000Z`)
    );
    const globalStartISO = new Date(
      Date.parse(earliestPrevStartISO) - lookbackMs
    ).toISOString();
    const globalEndISO = endOfBerlinDayISO(new Date(`${maxYMD}T00:00:00.000Z`)); // end of the last sleep day

    // Fetch all coffee events once in that range (raw UTC ISO instants)
    const allEventsInRange = await qCoffeeInRange(globalStartISO, globalEndISO);

    // Fetch workouts in the range to check if there was a workout on the previous day
    const workoutsInRange = await sql`
      SELECT date::text as date
      FROM workouts
      WHERE date >= ${minYMD}::date - interval '1 day'
        AND date <= ${maxYMD}::date
    `;
    const workoutDates = new Set(
      workoutsInRange.map((r) => String(r.date))
    );

    const sleepPrevCaff = sleepRows
      .map(
        (row: {
          date: string;
          sleep_score: number;
          focus_minutes: number;
        }) => {
          // For each sleep day, calculate residual caffeine at midnight (00:00 of that day)
          // by summing decay from all previous caffeine consumption
          const sleepDayStartISO = startOfBerlinDayISO(
            new Date(`${row.date}T00:00:00.000Z`)
          ); // midnight in UTC
          const midnightMs = Date.parse(sleepDayStartISO);

          // Get all events before midnight (including lookback period)
          const windowStartISO = new Date(midnightMs - lookbackMs).toISOString();
          const evs = eventsBetween(
            allEventsInRange,
            windowStartISO,
            sleepDayStartISO
          );

          // Calculate residual caffeine at midnight by summing exponential decay
          // from all previous doses (same algorithm as in modelCaffeine)
          const halfLifeHours = body.half_life_hours ?? 5;
          const kPerMinute = Math.log(2) / (halfLifeHours * 60);

          // Dose calculation parameters (same as modelCaffeine)
          const sensitivity = body.caffeine_sensitivity ?? 1.0;
          const bioavailability = body.bioavailability ?? 0.9;
          const mgPerMl = {
            espresso: 2.1,
            v60: 0.8,
            chemex: 0.8,
            moka: 1.6,
            aero: 1.1,
            cold_brew: 1.0,
            other: 1.0,
          };
          const shotMl = {
            espresso: 38,
            v60: 250,
            chemex: 300,
            moka: 60,
            aero: 200,
            cold_brew: 250,
            other: 200,
          };

          let midnightBodyMg = 0;
          for (const e of evs) {
            const eventMs = Date.parse(e.timeISO);
            if (eventMs >= midnightMs) continue; // Only events before midnight

            // Calculate dose (same logic as modelCaffeine)
            const type = (e.type || "other") as keyof typeof mgPerMl;
            const amount =
              typeof e.amount_ml === "number" && e.amount_ml > 0
                ? e.amount_ml
                : (shotMl[type] ?? shotMl.other);
            const baseDose = amount * (mgPerMl[type] ?? mgPerMl.other);
            const effectiveDose = baseDose * bioavailability * sensitivity;

            // Apply exponential decay from consumption time to midnight
            const dtMinutes = (midnightMs - eventMs) / (60 * 1000);
            const remaining = effectiveDose * Math.exp(-kPerMinute * dtMinutes);
            midnightBodyMg += remaining;
          }

          // Check if there was a workout on the previous day
          const prevDate = prevBerlinDateKey(row.date);
          const hadWorkout = workoutDates.has(prevDate);

          return {
            date: row.date,
            sleep_score: row.sleep_score,
            prev_caffeine_mg: Math.round(midnightBodyMg),
            prev_day_workout: hadWorkout,
          };
        }
      )
      .filter(
        (p: {
          date: string;
          sleep_score: number;
          prev_caffeine_mg: number;
          prev_day_workout: boolean;
        }) =>
          !(
            p.prev_caffeine_mg === 0 &&
            (!p.sleep_score || p.sleep_score === 0)
          )
      );

    return {
      habitsConsistency: consistency,
      habitStreaks,
      writingVsFocus,
      sleepPrevCaff,
    };
  },
  [CACHE_KEYS.HABITS_DATA],
  {
    tags: [CACHE_TAGS.HABITS],
    revalidate: 300, // 5 minutes
  }
);

export type HabitsDashboardData = Awaited<ReturnType<typeof getHabitsDashboardData>>;
