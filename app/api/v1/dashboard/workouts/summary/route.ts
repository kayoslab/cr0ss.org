export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { workoutsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for workouts summary endpoint
 */
const WorkoutsSummaryResponseSchema = z.object({
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

export type WorkoutsSummaryResponse = z.infer<typeof WorkoutsSummaryResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  period: z.enum(['today', 'week', 'month']).optional(),
});

/**
 * Get workouts summary for a specific period
 *
 * @param period - Period to summarize (today, week, month)
 * @returns Workouts summary data
 */
async function getWorkoutsSummary(period: string): Promise<WorkoutsSummaryResponse> {
  // Get date in Berlin timezone
  const [{ current_date }] = await sql/*sql*/`
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;

  // Calculate start date based on period
  let startDate: string;
  switch (period) {
    case 'today':
      startDate = String(current_date);
      break;
    case 'week':
      const [{ week_start }] = await sql/*sql*/`
        SELECT (${current_date}::date - interval '6 days')::date::text as week_start
      `;
      startDate = String(week_start);
      break;
    case 'month':
    default:
      const [{ month_start }] = await sql/*sql*/`
        SELECT date_trunc('month', ${current_date}::date)::date::text as month_start
      `;
      startDate = String(month_start);
      break;
  }

  // Query for workout types summary
  const workoutTypesRows = await sql/*sql*/`
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

  const workout_types = workoutTypesRows.map((r) => ({
    type: String(r.type),
    count: Number(r.count),
    total_duration_min: Number(r.total_duration_min),
    avg_duration_min: Number(r.avg_duration_min),
  }));

  // Calculate total workouts and duration
  const total_workouts = workout_types.reduce((sum, wt) => sum + wt.count, 0);
  const total_duration_min = workout_types.reduce((sum, wt) => sum + wt.total_duration_min, 0);

  // Calculate streaks (current and longest)
  // A streak is broken if > 2 days gap between workouts
  const streakRows = await sql/*sql*/`
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
        LAG(date) OVER (ORDER BY date DESC) as prev_date,
        (LAG(date) OVER (ORDER BY date DESC) - date) as days_diff
      FROM workout_dates
    )
    SELECT
      date,
      days_diff
    FROM date_diffs
    ORDER BY date DESC
  `;

  interface StreakRow {
    date: Date;
    days_diff: number | null;
  }

  const streakData = streakRows.map((r) => r as StreakRow);

  // Calculate current streak
  let current_streak = 0;
  for (const row of streakData) {
    if (row.days_diff === null) {
      // First workout in the list
      current_streak++;
      break;
    } else if (row.days_diff <= 2) {
      // Continue streak
      current_streak++;
    } else {
      // Streak broken
      break;
    }
  }

  // Calculate longest streak
  let longest_streak = 0;
  let temp_streak = 0;
  for (const row of streakData) {
    if (row.days_diff === null || row.days_diff <= 2) {
      temp_streak++;
      longest_streak = Math.max(longest_streak, temp_streak);
    } else {
      temp_streak = 1; // Start new streak
    }
  }

  return {
    period,
    workout_types,
    total_workouts,
    total_duration_min,
    streaks: {
      current: current_streak,
      longest: longest_streak,
    },
  };
}

/**
 * GET /api/v1/dashboard/workouts/summary
 *
 * Returns workouts summary for a specific period.
 *
 * Query Parameters:
 * - period (optional): Period to summarize (today, week, month). Defaults to month.
 *
 * Response:
 * - period: Period of the summary
 * - workout_types: Array of workout types with counts and durations
 * - total_workouts: Total number of workouts
 * - total_duration_min: Total duration in minutes
 * - streaks: Current and longest workout streaks
 *
 * Cache:
 * - Duration: 1 minute (REALTIME)
 * - Tags: workouts:summary:{period}, workouts:summary
 *
 * Example:
 * GET /api/v1/dashboard/workouts/summary?period=week
 * {
 *   "period": "week",
 *   "workout_types": [
 *     { "type": "running", "count": 3, "total_duration_min": 150, "avg_duration_min": 50 },
 *     { "type": "climbing", "count": 1, "total_duration_min": 60, "avg_duration_min": 60 }
 *   ],
 *   "total_workouts": 4,
 *   "total_duration_min": 210,
 *   "streaks": { "current": 3, "longest": 7 }
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-workouts-summary', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/workouts/summary')
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

      // Fetch workouts summary data
      const summary = await getWorkoutsSummary(period);

      // Validate response schema
      const validatedSummary = WorkoutsSummaryResponseSchema.parse(summary);

      // Generate cache tags
      const tags = [workoutsTags('summary', period), workoutsTags('summary')];

      // Return response with cache headers
      const response = apiSuccess(validatedSummary);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (1 minute)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.REALTIME}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching workouts summary:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch workouts summary',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
