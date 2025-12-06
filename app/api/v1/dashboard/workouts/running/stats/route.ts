export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { workoutsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for running stats endpoint
 */
const RunningStatsResponseSchema = z.object({
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

export type RunningStatsResponse = z.infer<typeof RunningStatsResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  period: z.enum(['month', 'year', 'all']).optional(),
});

/**
 * Get running statistics for a specific period
 *
 * @param period - Period to summarize (month, year, all)
 * @returns Running stats data
 */
async function getRunningStats(period: string): Promise<RunningStatsResponse> {
  // Get current date in Berlin timezone
  const [{ current_date }] = await sql/*sql*/`
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;

  // Calculate start date based on period
  let startDate: string;
  switch (period) {
    case 'month':
      const [{ month_start }] = await sql/*sql*/`
        SELECT date_trunc('month', ${current_date}::date)::date::text as month_start
      `;
      startDate = String(month_start);
      break;
    case 'year':
      const [{ year_start }] = await sql/*sql*/`
        SELECT date_trunc('year', ${current_date}::date)::date::text as year_start
      `;
      startDate = String(year_start);
      break;
    case 'all':
    default:
      startDate = '1970-01-01';
      break;
  }

  // Query for running stats
  const statsRows = await sql/*sql*/`
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

  const stats = statsRows[0];
  const total_runs = Number(stats.total_runs);
  const total_distance_km = Number(stats.total_distance_km);
  const total_duration_min = Number(stats.total_duration_min);

  // Calculate average pace (sec/km)
  // avg_pace = (total_duration_min * 60) / total_distance_km
  const avg_pace_sec_per_km =
    total_distance_km > 0 ? (total_duration_min * 60) / total_distance_km : 0;

  // Get personal records (all-time)
  // Longest run
  const longestRunRows = await sql/*sql*/`
    SELECT
      date::text,
      (details->>'distance_m')::numeric / 1000 as distance_km
    FROM workouts
    WHERE workout_type = 'running'
      AND details ? 'distance_m'
      AND (details->>'distance_m')::numeric > 0
    ORDER BY (details->>'distance_m')::numeric DESC
    LIMIT 1
  `;

  let longest_run_km = 0;
  let longest_run_date = current_date;
  if (longestRunRows.length > 0) {
    longest_run_km = Number(longestRunRows[0].distance_km);
    longest_run_date = String(longestRunRows[0].date);
  }

  // Fastest pace (all-time)
  // Pace is calculated as (duration_min * 60) / distance_km
  const fastestPaceRows = await sql/*sql*/`
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

  let fastest_pace_sec_per_km = 0;
  let fastest_pace_date = current_date;
  if (fastestPaceRows.length > 0) {
    fastest_pace_sec_per_km = Number(fastestPaceRows[0].pace_sec_per_km);
    fastest_pace_date = String(fastestPaceRows[0].date);
  }

  // Get monthly progress if period is 'month'
  let monthly_progress = undefined;
  if (period === 'month') {
    const monthProgressRows = await sql/*sql*/`
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

    if (monthProgressRows.length > 0) {
      const target_km = Number(monthProgressRows[0].target_km);
      const current_km = Number(monthProgressRows[0].current_km);
      const remaining_km = target_km - current_km;
      const progress_pct = target_km > 0 ? Math.min(100, (current_km / target_km) * 100) : 0;

      monthly_progress = {
        target_km,
        current_km,
        remaining_km,
        progress_pct,
      };
    }
  }

  const response: RunningStatsResponse = {
    period,
    total_runs,
    total_distance_km,
    total_duration_min,
    avg_pace_sec_per_km,
    personal_records: {
      longest_run_km,
      longest_run_date,
      fastest_pace_sec_per_km,
      fastest_pace_date,
    },
  };

  if (monthly_progress) {
    response.monthly_progress = monthly_progress;
  }

  return response;
}

/**
 * GET /api/v1/dashboard/workouts/running/stats
 *
 * Returns running statistics for a specific period.
 *
 * Query Parameters:
 * - period (optional): Period to summarize (month, year, all). Defaults to month.
 *
 * Response:
 * - period: Period of the stats
 * - total_runs: Total number of runs
 * - total_distance_km: Total distance in kilometers
 * - total_duration_min: Total duration in minutes
 * - avg_pace_sec_per_km: Average pace in seconds per kilometer
 * - personal_records: All-time personal records
 * - monthly_progress: Monthly goal progress (only for period=month)
 *
 * Cache:
 * - Duration: 1 minute (REALTIME)
 * - Tags: workouts:running:{period}, workouts:running
 *
 * Example:
 * GET /api/v1/dashboard/workouts/running/stats?period=month
 * {
 *   "period": "month",
 *   "total_runs": 12,
 *   "total_distance_km": 85.5,
 *   "total_duration_min": 600,
 *   "avg_pace_sec_per_km": 421,
 *   "personal_records": {
 *     "longest_run_km": 21.1,
 *     "longest_run_date": "2025-11-15",
 *     "fastest_pace_sec_per_km": 240,
 *     "fastest_pace_date": "2025-10-20"
 *   },
 *   "monthly_progress": {
 *     "target_km": 100,
 *     "current_km": 85.5,
 *     "remaining_km": 14.5,
 *     "progress_pct": 85.5
 *   }
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-running-stats', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/workouts/running/stats')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const periodParam = url.searchParams.get('period') || 'month';

      // Validate query parameters
      const paramsResult = QueryParamsSchema.safeParse({ period: periodParam });
      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const period = paramsResult.data.period || 'month';

      // Fetch running stats
      const stats = await getRunningStats(period);

      // Validate response schema
      const validatedStats = RunningStatsResponseSchema.parse(stats);

      // Generate cache tags
      const tags = [workoutsTags('running', period), workoutsTags('running')];

      // Return response with cache headers
      const response = apiSuccess(validatedStats);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (1 minute)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.REALTIME}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching running stats:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch running stats',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
