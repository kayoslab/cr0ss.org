export const runtime = 'edge';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { goalsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for goals progress endpoint
 */
const GoalProgressItemSchema = z.object({
  goal: z.string(),
  target: z.number(),
  current: z.number(),
  progress_pct: z.number().min(0).max(100),
  unit: z.string(),
});

const GoalsProgressResponseSchema = z.object({
  daily: z.array(GoalProgressItemSchema).optional(),
  monthly: z.array(GoalProgressItemSchema).optional(),
});

export type GoalsProgressResponse = z.infer<typeof GoalsProgressResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  period: z.enum(['daily', 'monthly']).optional(),
});

/**
 * Get goal progress for a specific period
 *
 * @param period - Period filter ('daily', 'monthly', or undefined for both)
 * @returns Progress data for goals
 */
async function getGoalsProgress(
  period?: 'daily' | 'monthly'
): Promise<GoalsProgressResponse> {
  // Get current month start in Berlin timezone
  const [{ month_start }] = await sql/*sql*/`
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;

  // Get today's date in Berlin timezone
  const [{ today }] = await sql/*sql*/`
    SELECT timezone('Europe/Berlin', now())::date::text AS today
  `;

  const result: GoalsProgressResponse = {};

  // Fetch daily goals progress
  if (!period || period === 'daily') {
    const dailyGoals = await sql/*sql*/`
      SELECT kind::text, target::numeric
      FROM monthly_goals
      WHERE month = ${month_start}::date
        AND period = 'daily'
    `;

    interface GoalRow {
      kind: string;
      target: number;
    }

    const dailyProgress: Array<{
      goal: string;
      target: number;
      current: number;
      progress_pct: number;
      unit: string;
    }> = [];

    for (const r of dailyGoals) {
      const row = r as GoalRow;
      const kind = String(row.kind);
      const target = Number(row.target);

      // Get current value for today
      const currentRows = await sql/*sql*/`
        SELECT COALESCE(${sql.unsafe(kind)}, 0)::numeric as current
        FROM days
        WHERE date = ${today}::date
        LIMIT 1
      `;

      const current = currentRows.length > 0 ? Number(currentRows[0].current) : 0;
      const progressPct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

      // Determine unit based on goal kind
      const unit = kind === 'steps' ? 'steps' : 'minutes';

      // Format goal name for display
      const goalName = kind
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      dailyProgress.push({
        goal: goalName,
        target,
        current,
        progress_pct: progressPct,
        unit,
      });
    }

    if (dailyProgress.length > 0) {
      result.daily = dailyProgress;
    }
  }

  // Fetch monthly goals progress
  if (!period || period === 'monthly') {
    const monthlyGoals = await sql/*sql*/`
      SELECT kind::text, target::numeric
      FROM monthly_goals
      WHERE month = ${month_start}::date
        AND period = 'monthly'
    `;

    interface GoalRow {
      kind: string;
      target: number;
    }

    const monthlyProgress: Array<{
      goal: string;
      target: number;
      current: number;
      progress_pct: number;
      unit: string;
    }> = [];

    for (const r of monthlyGoals) {
      const row = r as GoalRow;
      const kind = String(row.kind);
      const target = Number(row.target);

      let current = 0;
      let unit = '';

      // Handle running distance specifically
      if (kind === 'running_distance_km') {
        const distanceRows = await sql/*sql*/`
          SELECT COALESCE(SUM((details->>'distance_km')::numeric), 0)::numeric as total
          FROM workouts
          WHERE workout_type = 'running'
            AND date >= ${month_start}::date
            AND date < (${month_start}::date + interval '1 month')
            AND details ? 'distance_km'
        `;
        current = distanceRows.length > 0 ? Number(distanceRows[0].total) : 0;
        unit = 'km';
      } else {
        // For other potential monthly goals, sum from days table
        const sumRows = await sql/*sql*/`
          SELECT COALESCE(SUM(${sql.unsafe(kind)}), 0)::numeric as total
          FROM days
          WHERE date >= ${month_start}::date
            AND date < (${month_start}::date + interval '1 month')
        `;
        current = sumRows.length > 0 ? Number(sumRows[0].total) : 0;
        unit = kind === 'steps' ? 'steps' : 'minutes';
      }

      const progressPct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

      // Format goal name for display
      const goalName = kind
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      monthlyProgress.push({
        goal: goalName,
        target,
        current,
        progress_pct: progressPct,
        unit,
      });
    }

    if (monthlyProgress.length > 0) {
      result.monthly = monthlyProgress;
    }
  }

  return result;
}

/**
 * GET /api/v1/dashboard/goals/progress
 *
 * Returns progress towards goals for daily and/or monthly periods.
 *
 * Query Parameters:
 * - period (optional): Filter by period ('daily' or 'monthly'). Defaults to returning both.
 *
 * Response:
 * - daily: Array of daily goal progress (optional)
 *   - goal: Goal name
 *   - target: Target value
 *   - current: Current value
 *   - progress_pct: Progress percentage (0-100)
 *   - unit: Unit of measurement (steps, minutes, km)
 * - monthly: Array of monthly goal progress (optional)
 *   - Same structure as daily
 *
 * Cache:
 * - Duration: 1 minute (FREQUENT)
 * - Tags: goals:progress:{period}, goals:progress
 *
 * Example:
 * GET /api/v1/dashboard/goals/progress
 * {
 *   "daily": [
 *     {
 *       "goal": "Steps",
 *       "target": 10000,
 *       "current": 8500,
 *       "progress_pct": 85,
 *       "unit": "steps"
 *     }
 *   ],
 *   "monthly": [
 *     {
 *       "goal": "Running Distance Km",
 *       "target": 100,
 *       "current": 45.5,
 *       "progress_pct": 46,
 *       "unit": "km"
 *     }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-goals-progress', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/goals/progress')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const periodParam = url.searchParams.get('period');

      // Validate parameters (convert null to undefined for optional fields)
      const paramsResult = QueryParamsSchema.safeParse({
        ...(periodParam !== null && { period: periodParam }),
      });
      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const { period } = paramsResult.data;

      // Fetch progress data
      const progress = await getGoalsProgress(period);

      // Validate response schema
      const validatedProgress = GoalsProgressResponseSchema.parse(progress);

      // Generate cache tags
      const tags = period
        ? [goalsTags('progress', period), goalsTags('progress')]
        : [goalsTags('progress')];

      // Return response with cache headers
      const response = apiSuccess(validatedProgress);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (1 minute - FREQUENT)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.REALTIME}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching goals progress:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch goals progress',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
