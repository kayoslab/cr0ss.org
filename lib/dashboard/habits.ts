/**
 * Habits dashboard data: today's numbers, consistency, streaks, trends and the
 * sleep-vs-previous-day-caffeine series.
 */
import { z } from 'zod';
import { sql } from '@/lib/db/client';
import { cached } from '@/lib/cache/cached';
import { tags, CACHE_LIFE } from '@/lib/cache/tags';
import {
  startOfBerlinDayISO,
  endOfBerlinDayISO,
  prevBerlinDateKey,
} from '@/lib/time/berlin';
import { qSleepVsFocusScatter, qCoffeeInRange } from '@/lib/db/queries';
import { getBodyProfile } from '@/lib/user/profile';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const HabitsTodaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().min(0),
  reading_minutes: z.number().int().min(0),
  outdoor_minutes: z.number().int().min(0),
  writing_minutes: z.number().int().min(0),
  coding_minutes: z.number().int().min(0),
  focus_minutes: z.number().int().min(0),
  sleep_score: z.number().int().min(0).max(100).optional(),
});
export type HabitsToday = z.infer<typeof HabitsTodaySchema>;

export const HabitsConsistencySchema = z.object({
  period_days: z.number().int().min(1),
  habits: z.array(
    z.object({
      name: z.string(),
      target: z.number(),
      days_met: z.number().int().min(0),
      consistency_pct: z.number().min(0).max(100),
    })
  ),
});
export type HabitsConsistency = z.infer<typeof HabitsConsistencySchema>;

export const HabitsStreaksSchema = z.object({
  streaks: z.array(
    z.object({
      habit: z.string(),
      current: z.number().int().min(0),
      longest: z.number().int().min(0),
      target: z.number(),
    })
  ),
});
export type HabitsStreaks = z.infer<typeof HabitsStreaksSchema>;

export const HabitsTrendsSchema = z.object({
  trends: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      values: z.record(z.string(), z.number().int().min(0)),
    })
  ),
});
export type HabitsTrends = z.infer<typeof HabitsTrendsSchema>;

export const SleepQualitySchema = z.object({
  data: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      sleep_score: z.number().int().min(0).max(100),
      prev_caffeine_mg: z.number().int().min(0),
      prev_day_workout: z.boolean(),
    })
  ),
});
export type SleepQuality = z.infer<typeof SleepQualitySchema>;

/** Habit columns in the `days` table that trends may request. */
export const HABIT_COLUMNS = [
  'steps',
  'reading_minutes',
  'outdoor_minutes',
  'writing_minutes',
  'coding_minutes',
  'focus_minutes',
] as const;
export type HabitColumn = (typeof HABIT_COLUMNS)[number];

const HABIT_LABELS = {
  steps: 'Steps',
  reading_minutes: 'Reading',
  outdoor_minutes: 'Outdoors',
  writing_minutes: 'Writing',
  coding_minutes: 'Coding',
} as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

async function queryHabitsToday(date: string): Promise<HabitsToday> {
  const rows = await sql /*sql*/ `
    SELECT
      to_char(date, 'YYYY-MM-DD') as date,
      COALESCE(steps, 0)::int as steps,
      COALESCE(reading_minutes, 0)::int as reading_minutes,
      COALESCE(outdoor_minutes, 0)::int as outdoor_minutes,
      COALESCE(writing_minutes, 0)::int as writing_minutes,
      COALESCE(coding_minutes, 0)::int as coding_minutes,
      COALESCE(focus_minutes, 0)::int as focus_minutes,
      sleep_score::int as sleep_score
    FROM days
    WHERE date = ${date}::date
    LIMIT 1
  `;
  if (rows.length === 0) {
    return HabitsTodaySchema.parse({
      date,
      steps: 0,
      reading_minutes: 0,
      outdoor_minutes: 0,
      writing_minutes: 0,
      coding_minutes: 0,
      focus_minutes: 0,
    });
  }
  const row = rows[0];
  return HabitsTodaySchema.parse({
    date: String(row.date),
    steps: Number(row.steps),
    reading_minutes: Number(row.reading_minutes),
    outdoor_minutes: Number(row.outdoor_minutes),
    writing_minutes: Number(row.writing_minutes),
    coding_minutes: Number(row.coding_minutes),
    focus_minutes: Number(row.focus_minutes),
    sleep_score: row.sleep_score != null ? Number(row.sleep_score) : undefined,
  });
}

/** Daily targets for the current month, with defaults when none are set. */
async function dailyTargets(): Promise<Map<string, number>> {
  const [{ month_start }] = await sql /*sql*/ `
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;
  const rows = await sql /*sql*/ `
    SELECT kind::text, target::numeric
    FROM monthly_goals
    WHERE month = ${month_start}::date
      AND period = 'daily'
  `;
  const targets = new Map<string, number>();
  for (const r of rows) targets.set(String(r.kind), Number(r.target));
  if (targets.size === 0) {
    targets.set('steps', 8000);
    targets.set('reading_minutes', 30);
    targets.set('outdoor_minutes', 30);
    targets.set('writing_minutes', 30);
    targets.set('coding_minutes', 30);
  }
  return targets;
}

async function queryHabitsConsistency(
  days: number
): Promise<HabitsConsistency> {
  const targets = await dailyTargets();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = startDate.toISOString().slice(0, 10);

  const rows = await sql /*sql*/ `
    SELECT steps, reading_minutes, outdoor_minutes, writing_minutes, coding_minutes
    FROM days
    WHERE date >= ${startStr}::date
      AND date <= current_date
    ORDER BY date ASC
  `;

  const habits = Object.entries(HABIT_LABELS).map(([key, label]) => {
    const target = targets.get(key) || 0;
    const daysMet = rows.filter(
      (row) => Number(row[key] || 0) >= target
    ).length;
    return {
      name: label,
      target,
      days_met: daysMet,
      consistency_pct: days > 0 ? Math.round((daysMet / days) * 100) : 0,
    };
  });
  return HabitsConsistencySchema.parse({ period_days: days, habits });
}

/** Streak over a most-recent-first boolean series. */
function calculateStreak(data: boolean[]): {
  current: number;
  longest: number;
} {
  let current = 0;
  let longest = 0;
  let streak = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i]) {
      streak++;
      if (i === 0) current = streak;
      longest = Math.max(longest, streak);
    } else {
      if (i === 0) current = 0;
      streak = 0;
    }
  }
  return { current, longest };
}

async function queryHabitsStreaks(): Promise<HabitsStreaks> {
  const targets = await dailyTargets();
  const rows = await sql /*sql*/ `
    SELECT date, steps, reading_minutes, outdoor_minutes, writing_minutes, coding_minutes
    FROM days
    WHERE date >= current_date - interval '365 days'
    ORDER BY date DESC
  `;
  const streaks = Object.entries(HABIT_LABELS).map(([key, label]) => {
    const target = targets.get(key) || 0;
    const meets = rows.map((row) => Number(row[key] || 0) >= target);
    return { habit: label, target, ...calculateStreak(meets) };
  });
  return HabitsStreaksSchema.parse({ streaks });
}

async function queryHabitsTrends(
  habitsCsv: string,
  days: number
): Promise<HabitsTrends> {
  const habits = habitsCsv
    .split(',')
    .map((h) => h.trim())
    .filter((h): h is HabitColumn =>
      (HABIT_COLUMNS as readonly string[]).includes(h)
    );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = startDate.toISOString().slice(0, 10);

  // Column names are validated against HABIT_COLUMNS above, so interpolating is safe.
  const columns = habits
    .map((h) => `COALESCE(${h}, 0)::int as ${h}`)
    .join(', ');
  const rows = await sql /*sql*/ `
    SELECT
      to_char(date, 'YYYY-MM-DD') as date,
      ${sql.unsafe(columns)}
    FROM days
    WHERE date >= ${startStr}::date
      AND date <= current_date
    ORDER BY date ASC
  `;
  const trends = rows.map((row) => ({
    date: String(row.date),
    values: Object.fromEntries(habits.map((h) => [h, Number(row[h] || 0)])),
  }));
  return HabitsTrendsSchema.parse({ trends });
}

/** Sleep score per night against modelled residual caffeine at midnight. */
async function querySleepQuality(): Promise<SleepQuality> {
  const [body, sleepRows] = await Promise.all([
    getBodyProfile(),
    qSleepVsFocusScatter(60),
  ]);
  if (sleepRows.length === 0) return { data: [] };

  const minYMD = sleepRows[0].date;
  const maxYMD = sleepRows[sleepRows.length - 1].date;

  // One coffee query covering (earliest previous day - lookback) .. (latest day end).
  const halfLifeHours = body.half_life_hours ?? 5;
  const lookbackMs =
    Math.max(24, Math.ceil(halfLifeHours * 4)) * 60 * 60 * 1000;
  const earliestPrevStartISO = startOfBerlinDayISO(
    new Date(`${prevBerlinDateKey(minYMD)}T00:00:00.000Z`)
  );
  const globalStartISO = new Date(
    Date.parse(earliestPrevStartISO) - lookbackMs
  ).toISOString();
  const globalEndISO = endOfBerlinDayISO(new Date(`${maxYMD}T00:00:00.000Z`));

  const [events, workoutsInRange] = await Promise.all([
    qCoffeeInRange(globalStartISO, globalEndISO),
    sql`
      SELECT date::text as date
      FROM workouts
      WHERE date >= ${minYMD}::date - interval '1 day'
        AND date <= ${maxYMD}::date
    `,
  ]);
  const workoutDates = new Set(workoutsInRange.map((r) => String(r.date)));

  // Same dose model as lib/phys/caffeine.ts, evaluated at one instant (midnight).
  const kPerMinute = Math.log(2) / (halfLifeHours * 60);
  const sensitivity = body.caffeine_sensitivity ?? 1.0;
  const bioavailability = body.bioavailability ?? 0.9;
  const mgPerMl: Record<string, number> = {
    espresso: 2.1,
    v60: 0.8,
    chemex: 0.8,
    moka: 1.6,
    aero: 1.1,
    cold_brew: 1.0,
    other: 1.0,
  };
  const shotMl: Record<string, number> = {
    espresso: 38,
    v60: 250,
    chemex: 300,
    moka: 60,
    aero: 200,
    cold_brew: 250,
    other: 200,
  };

  const data = sleepRows
    .map((row) => {
      const midnightMs = Date.parse(
        startOfBerlinDayISO(new Date(`${row.date}T00:00:00.000Z`))
      );
      const windowStartMs = midnightMs - lookbackMs;
      let midnightBodyMg = 0;
      for (const e of events) {
        const t = Date.parse(e.time);
        if (t < windowStartMs || t >= midnightMs) continue;
        const type = e.type || 'other';
        const amount =
          e.amount_ml > 0 ? e.amount_ml : (shotMl[type] ?? shotMl.other);
        const dose =
          amount *
          (mgPerMl[type] ?? mgPerMl.other) *
          bioavailability *
          sensitivity;
        midnightBodyMg +=
          dose * Math.exp(-kPerMinute * ((midnightMs - t) / 60000));
      }
      return {
        date: row.date,
        sleep_score: row.sleep_score,
        prev_caffeine_mg: Math.round(midnightBodyMg),
        prev_day_workout: workoutDates.has(prevBerlinDateKey(row.date)),
      };
    })
    .filter((p) => !(p.prev_caffeine_mg === 0 && !p.sleep_score));

  return SleepQualitySchema.parse({ data });
}

// ---------------------------------------------------------------------------
// Cached public API
// ---------------------------------------------------------------------------

export const getHabitsToday = cached('habits-today', queryHabitsToday, {
  tags: (date) => [tags.habits.today(date), tags.habits.today()],
  revalidate: CACHE_LIFE.realtime,
});

export const getHabitsConsistency = cached(
  'habits-consistency',
  queryHabitsConsistency,
  {
    tags: (days) => [tags.habits.consistency(days), tags.habits.consistency()],
    revalidate: CACHE_LIFE.frequent,
  }
);

export const getHabitsStreaks = cached('habits-streaks', queryHabitsStreaks, {
  tags: () => [tags.habits.streaks],
  revalidate: CACHE_LIFE.frequent,
});

export const getHabitsTrends = cached('habits-trends', queryHabitsTrends, {
  tags: (habits, days) => [
    tags.habits.trends(habits, days),
    tags.habits.trends(),
  ],
  revalidate: CACHE_LIFE.frequent,
});

export const getSleepQuality = cached(
  'habits-sleep-quality',
  querySleepQuality,
  {
    tags: () => [tags.habits.sleepQuality],
    revalidate: CACHE_LIFE.frequent,
  }
);
