export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { goalsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for goals endpoint
 */
const GoalsResponseSchema = z.object({
  daily: z.record(z.string(), z.number()),
  monthly: z.record(z.string(), z.number()),
});

export type GoalsResponse = z.infer<typeof GoalsResponseSchema>;

/**
 * Get all goals (daily and monthly)
 *
 * @returns Goals data organized by period
 */
async function getGoals(): Promise<GoalsResponse> {
  // Get current month start in Berlin timezone
  const [{ month_start }] = await sql/*sql*/`
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;

  // Fetch all goals for the current month
  const rows = await sql/*sql*/`
    SELECT kind::text, target::numeric, period::text
    FROM monthly_goals
    WHERE month = ${month_start}::date
  `;

  interface GoalRow {
    kind: string;
    target: number;
    period: string;
  }

  const daily: Record<string, number> = {};
  const monthly: Record<string, number> = {};

  for (const r of rows) {
    const row = r as GoalRow;
    const kind = String(row.kind);
    const target = Number(row.target);
    const period = String(row.period);

    if (period === 'daily') {
      daily[kind] = target;
    } else if (period === 'monthly') {
      monthly[kind] = target;
    }
  }

  return { daily, monthly };
}

/**
 * GET /api/v1/dashboard/goals
 *
 * Returns all goals organized by period (daily and monthly).
 *
 * Response:
 * - daily: Object mapping goal names to daily target values
 *   Example: { "steps": 10000, "reading_minutes": 30 }
 * - monthly: Object mapping goal names to monthly target values
 *   Example: { "running_distance_km": 100 }
 *
 * Cache:
 * - Duration: 10 minutes (STABLE - changes infrequently)
 * - Tags: goals
 *
 * Example:
 * GET /api/v1/dashboard/goals
 * {
 *   "daily": {
 *     "steps": 10000,
 *     "reading_minutes": 30,
 *     "outdoor_minutes": 30,
 *     "writing_minutes": 60,
 *     "coding_minutes": 120,
 *     "focus_minutes": 180
 *   },
 *   "monthly": {
 *     "running_distance_km": 100
 *   }
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-goals', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/goals')
  .handle(async (request) => {
    try {
      // Fetch goals data
      const goals = await getGoals();

      // Validate response schema
      const validatedGoals = GoalsResponseSchema.parse(goals);

      // Generate cache tags
      const tags = [goalsTags('goals')];

      // Return response with cache headers
      const response = apiSuccess(validatedGoals);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (10 minutes - STABLE)
      response.headers.set(
        'Cache-Control',
        `s-maxage=600, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching goals:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch goals',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
