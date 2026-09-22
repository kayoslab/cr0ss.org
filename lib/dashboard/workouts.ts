/**
 * Workouts dashboard data: period summary, activity heatmap, running stats.
 */
import { z } from 'zod';
import { sql } from '@/lib/db/client';
import { cached } from '@/lib/cache/cached';
import { tags, CACHE_LIFE } from '@/lib/cache/tags';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const WorkoutsSummarySchema = z.object({
  period: z.string(),
  workout_types: z.array(
    z.object({
      type: z.string(),
      count: z.number().int().min(0),
      total_duration_min: z.number().int().min(0),
      avg_duration_min: z.number().min(0),
    })
  ),
  total_workouts: z.number().int().min(0),
  total_duration_min: z.number().int().min(0),
  streaks: z.object({
    current: z.number().int().min(0),
    longest: z.number().int().min(0),
  }),
});
export type WorkoutsSummary = z.infer<typeof WorkoutsSummarySchema>;
export type SummaryPeriod = 'today' | 'week' | 'month';

export const WorkoutsHeatmapSchema = z.object({
  heatmap: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      duration_min: z.number().int().min(0),
      distance_km: z.number().min(0).optional(),
      workouts: z.array(
        z.object({ type: z.string(), duration_min: z.number().int().min(0) })
      ),
    })
  ),
  stats: z.object({
    active_days: z.number().int().min(0),
    total_duration_min: z.number().int().min(0),
    avg_duration_min: z.number().min(0),
  }),
});
export type WorkoutsHeatmap = z.infer<typeof WorkoutsHeatmapSchema>;

export const RunningStatsSchema = z.object({
  period: z.string(),
  total_runs: z.number().int().min(0),
  total_distance_km: z.number().min(0),
  total_duration_min: z.number().int().min(0),
  avg_pace_sec_per_km: z.number().min(0),
  personal_records: z.object({
    longest_run_km: z.number().min(0),
    longest_run_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fastest_pace_sec_per_km: z.number().min(0),
    fastest_pace_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  monthly_progress: z
    .object({
      target_km: z.number().min(0),
      current_km: z.number().min(0),
      remaining_km: z.number(),
      progress_pct: z.number().min(0).max(100),
    })
    .optional(),
});
export type RunningStats = z.infer<typeof RunningStatsSchema>;
export type RunningPeriod = 'month' | 'year' | 'all';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

async function queryWorkoutsSummary(
  period: SummaryPeriod
): Promise<WorkoutsSummary> {
  const [{ current_date }] = await sql /*sql*/ `
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;

  let startDate: string;
  switch (period) {
    case 'today':
      startDate = String(current_date);
      break;
    case 'week': {
      const [{ week_start }] = await sql /*sql*/ `
        SELECT (${current_date}::date - interval '6 days')::date::text as week_start
      `;
      startDate = String(week_start);
      break;
    }
    case 'month':
    default: {
      const [{ month_start }] = await sql /*sql*/ `
        SELECT date_trunc('month', ${current_date}::date)::date::text as month_start
      `;
      startDate = String(month_start);
    }
  }

  // Every type ever logged, so the UI shows zero rows for idle types too.
  const allTypesRows = await sql /*sql*/ `
    SELECT DISTINCT workout_type::text as type
    FROM workouts
    ORDER BY workout_type::text
  `;
  const periodRows = await sql /*sql*/ `
    SELECT
      workout_type::text as type,
      COUNT(*)::int as count,
      SUM(duration_min)::int as total_duration_min,
      AVG(duration_min)::numeric as avg_duration_min
    FROM workouts
    WHERE date >= ${startDate}::date
      AND date <= ${current_date}::date
    GROUP BY workout_type
    ORDER BY total_duration_min DESC
  `;
  const byType = new Map(
    periodRows.map((r) => [
      String(r.type),
      {
        type: String(r.type),
        count: Number(r.count),
        total_duration_min: Number(r.total_duration_min),
        avg_duration_min: Number(r.avg_duration_min),
      },
    ])
  );
  const workout_types = allTypesRows.map(
    (r) =>
      byType.get(String(r.type)) ?? {
        type: String(r.type),
        count: 0,
        total_duration_min: 0,
        avg_duration_min: 0,
      }
  );

  // A streak is broken by more than two days between workouts.
  const streakRows = await sql /*sql*/ `
    WITH workout_dates AS (
      SELECT DISTINCT date
      FROM workouts
      WHERE date <= ${current_date}::date
      ORDER BY date DESC
      LIMIT 365
    ),
    date_diffs AS (
      SELECT
        date,
        (LAG(date) OVER (ORDER BY date DESC) - date) as days_diff
      FROM workout_dates
    )
    SELECT date, days_diff
    FROM date_diffs
    ORDER BY date DESC
  `;
  let current = 0;
  for (const row of streakRows) {
    if (row.days_diff === null) {
      current++;
      break;
    }
    if (Number(row.days_diff) <= 2) current++;
    else break;
  }
  let longest = 0;
  let run = 0;
  for (const row of streakRows) {
    if (row.days_diff === null || Number(row.days_diff) <= 2) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return WorkoutsSummarySchema.parse({
    period,
    workout_types,
    total_workouts: workout_types.reduce((s, w) => s + w.count, 0),
    total_duration_min: workout_types.reduce(
      (s, w) => s + w.total_duration_min,
      0
    ),
    streaks: { current, longest },
  });
}

async function queryWorkoutsHeatmap(
  days: number,
  workoutType?: string
): Promise<WorkoutsHeatmap> {
  const [{ current_date }] = await sql /*sql*/ `
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;
  const [{ start_date }] = await sql /*sql*/ `
    SELECT (${current_date}::date - interval '1 day' * (${days} - 1))::date::text as start_date
  `;

  const rows = workoutType
    ? await sql /*sql*/ `
        SELECT date::text, workout_type, duration_min::int
        FROM workouts
        WHERE date >= ${start_date}::date
          AND date <= ${current_date}::date
          AND workout_type = ${workoutType}
        ORDER BY date ASC, workout_type ASC
      `
    : await sql /*sql*/ `
        SELECT date::text, workout_type, duration_min::int
        FROM workouts
        WHERE date >= ${start_date}::date
          AND date <= ${current_date}::date
        ORDER BY date ASC, workout_type ASC
      `;

  const byDate = new Map<
    string,
    Array<{ type: string; duration_min: number }>
  >();
  for (const r of rows) {
    const d = String(r.date);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate
      .get(d)!
      .push({
        type: String(r.workout_type),
        duration_min: Number(r.duration_min),
      });
  }

  // Fill every day in the window (including zeros) so the grid is dense.
  const heatmap: WorkoutsHeatmap['heatmap'] = [];
  for (let i = 0; i < days; i++) {
    const [{ date }] = await sql /*sql*/ `
      SELECT (${start_date}::date + interval '1 day' * ${i})::date::text as date
    `;
    const workouts = byDate.get(String(date)) || [];
    heatmap.push({
      date: String(date),
      duration_min: workouts.reduce((s, w) => s + w.duration_min, 0),
      workouts,
    });
  }

  const active_days = heatmap.filter((d) => d.duration_min > 0).length;
  const total_duration_min = heatmap.reduce((s, d) => s + d.duration_min, 0);
  return WorkoutsHeatmapSchema.parse({
    heatmap,
    stats: {
      active_days,
      total_duration_min,
      avg_duration_min: active_days > 0 ? total_duration_min / active_days : 0,
    },
  });
}

async function queryRunningStats(period: RunningPeriod): Promise<RunningStats> {
  const [{ current_date }] = await sql /*sql*/ `
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;

  let startDate = '1970-01-01';
  if (period === 'month') {
    const [{ month_start }] = await sql /*sql*/ `
      SELECT date_trunc('month', ${current_date}::date)::date::text as month_start
    `;
    startDate = String(month_start);
  } else if (period === 'year') {
    const [{ year_start }] = await sql /*sql*/ `
      SELECT date_trunc('year', ${current_date}::date)::date::text as year_start
    `;
    startDate = String(year_start);
  }

  const [stats] = await sql /*sql*/ `
    SELECT
      COUNT(*)::int as total_runs,
      COALESCE(SUM((details->>'distance_m')::numeric / 1000), 0)::numeric as total_distance_km,
      COALESCE(SUM(duration_min), 0)::int as total_duration_min
    FROM workouts
    WHERE workout_type = 'running'
      AND date >= ${startDate}::date
      AND date <= ${current_date}::date
      AND details ? 'distance_m'
  `;
  const total_runs = Number(stats.total_runs);
  const total_distance_km = Number(stats.total_distance_km);
  const total_duration_min = Number(stats.total_duration_min);

  const longestRunRows = await sql /*sql*/ `
    SELECT date::text, (details->>'distance_m')::numeric / 1000 as distance_km
    FROM workouts
    WHERE workout_type = 'running'
      AND details ? 'distance_m'
      AND (details->>'distance_m')::numeric > 0
    ORDER BY (details->>'distance_m')::numeric DESC
    LIMIT 1
  `;
  const fastestPaceRows = await sql /*sql*/ `
    SELECT
      date::text,
      (duration_min * 60) / ((details->>'distance_m')::numeric / 1000) as pace_sec_per_km
    FROM workouts
    WHERE workout_type = 'running'
      AND details ? 'distance_m'
      AND (details->>'distance_m')::numeric > 0
      AND duration_min > 0
    ORDER BY pace_sec_per_km ASC
    LIMIT 1
  `;

  let monthly_progress: RunningStats['monthly_progress'];
  if (period === 'month') {
    const [row] = await sql /*sql*/ `
      WITH m AS (
        SELECT date_trunc('month', ${current_date}::date)::date AS month_start
      )
      SELECT
        COALESCE((
          SELECT target FROM monthly_goals
          WHERE month = m.month_start AND kind = 'running_distance_km'
        ), 0)::numeric AS target_km,
        COALESCE((
          SELECT SUM((details->>'distance_m')::numeric / 1000) FROM workouts
          WHERE workout_type = 'running'
            AND date >= m.month_start AND date < (m.month_start + interval '1 month')
            AND details ? 'distance_m'
        ), 0)::numeric AS current_km
      FROM m
    `;
    if (row) {
      const target_km = Number(row.target_km);
      const current_km = Number(row.current_km);
      monthly_progress = {
        target_km,
        current_km,
        remaining_km: target_km - current_km,
        progress_pct:
          target_km > 0 ? Math.min(100, (current_km / target_km) * 100) : 0,
      };
    }
  }

  return RunningStatsSchema.parse({
    period,
    total_runs,
    total_distance_km,
    total_duration_min,
    avg_pace_sec_per_km:
      total_distance_km > 0 ? (total_duration_min * 60) / total_distance_km : 0,
    personal_records: {
      longest_run_km: longestRunRows[0]
        ? Number(longestRunRows[0].distance_km)
        : 0,
      longest_run_date: longestRunRows[0]
        ? String(longestRunRows[0].date)
        : String(current_date),
      fastest_pace_sec_per_km: fastestPaceRows[0]
        ? Number(fastestPaceRows[0].pace_sec_per_km)
        : 0,
      fastest_pace_date: fastestPaceRows[0]
        ? String(fastestPaceRows[0].date)
        : String(current_date),
    },
    ...(monthly_progress && { monthly_progress }),
  });
}

// ---------------------------------------------------------------------------
// Cached public API
// ---------------------------------------------------------------------------

export const getWorkoutsSummary = cached(
  'workouts-summary',
  queryWorkoutsSummary,
  {
    tags: (period) => [tags.workouts.summary(period), tags.workouts.summary()],
    revalidate: CACHE_LIFE.realtime,
  }
);

export const getWorkoutsHeatmap = cached(
  'workouts-heatmap',
  queryWorkoutsHeatmap,
  {
    tags: (days, type) => [
      tags.workouts.heatmap(days, type ?? 'all'),
      tags.workouts.heatmap(),
    ],
    revalidate: CACHE_LIFE.frequent,
  }
);

export const getRunningStats = cached(
  'workouts-running-stats',
  queryRunningStats,
  {
    tags: (period) => [tags.workouts.running(period), tags.workouts.running()],
    revalidate: CACHE_LIFE.realtime,
  }
);
