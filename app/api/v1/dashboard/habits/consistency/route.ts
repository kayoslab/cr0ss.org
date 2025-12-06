export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { habitsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for habits consistency endpoint
 */
const HabitsConsistencyResponseSchema = z.object({
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

export type HabitsConsistencyResponse = z.infer<typeof HabitsConsistencyResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional().default(7),
});

/**
 * Get habit consistency data
 *
 * @param days - Number of days to analyze (default: 7, max: 90)
 * @returns Consistency data for all habits
 */
async function getHabitsConsistency(days: number): Promise<HabitsConsistencyResponse> {
  // Get goals from the goals table (daily targets)
  const [{ month_start }] = await sql/*sql*/`
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;

  const goalsRows = await sql/*sql*/`
    SELECT kind::text, target::numeric
    FROM monthly_goals
    WHERE month = ${month_start}::date
      AND period = 'daily'
  `;

  interface GoalRow {
    kind: string;
    target: number;
  }

  // Build map of habit targets
  const targets = new Map<string, number>();
  for (const r of goalsRows) {
    const row = r as GoalRow;
    targets.set(String(row.kind), Number(row.target));
  }

  // If no goals are set, use default thresholds
  if (targets.size === 0) {
    targets.set('steps', 8000);
    targets.set('reading_minutes', 30);
    targets.set('outdoor_minutes', 30);
    targets.set('writing_minutes', 30);
    targets.set('coding_minutes', 30);
  }

  // Get habit data for the specified period
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = startDate.toISOString().slice(0, 10);

  const rows = await sql/*sql*/`
    SELECT
      steps,
      reading_minutes,
      outdoor_minutes,
      writing_minutes,
      coding_minutes
    FROM days
    WHERE date >= ${startStr}::date
      AND date <= current_date
    ORDER BY date ASC
  `;

  interface HabitRow {
    steps: number | null;
    reading_minutes: number | null;
    outdoor_minutes: number | null;
    writing_minutes: number | null;
    coding_minutes: number | null;
  }

  // Calculate consistency for each habit
  const habits: Array<{
    name: string;
    target: number;
    days_met: number;
    consistency_pct: number;
  }> = [];

  const habitMap = {
    steps: 'Steps',
    reading_minutes: 'Reading',
    outdoor_minutes: 'Outdoors',
    writing_minutes: 'Writing',
    coding_minutes: 'Coding',
  };

  for (const [key, label] of Object.entries(habitMap)) {
    const target = targets.get(key) || 0;
    const daysMet = rows.filter((r) => {
      const row = r as HabitRow;
      const value = row[key as keyof HabitRow];
      return (value || 0) >= target;
    }).length;

    const consistencyPct = days > 0 ? Math.round((daysMet / days) * 100) : 0;

    habits.push({
      name: label,
      target,
      days_met: daysMet,
      consistency_pct: consistencyPct,
    });
  }

  return {
    period_days: days,
    habits,
  };
}

/**
 * GET /api/v1/dashboard/habits/consistency
 *
 * Returns habit consistency metrics over a specified period.
 *
 * Query Parameters:
 * - days (optional): Number of days to analyze (default: 7, max: 90)
 *
 * Response:
 * - period_days: Number of days analyzed
 * - habits: Array of habit metrics
 *   - name: Habit name
 *   - target: Daily target value
 *   - days_met: Number of days the target was met
 *   - consistency_pct: Percentage of days target was met
 *
 * Cache:
 * - Duration: 5 minutes (FREQUENT)
 * - Tags: habits:consistency:{days}, habits:consistency
 *
 * Example:
 * GET /api/v1/dashboard/habits/consistency?days=7
 * {
 *   "period_days": 7,
 *   "habits": [
 *     {
 *       "name": "Steps",
 *       "target": 8000,
 *       "days_met": 5,
 *       "consistency_pct": 71
 *     },
 *     {
 *       "name": "Reading",
 *       "target": 30,
 *       "days_met": 6,
 *       "consistency_pct": 86
 *     }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-consistency', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/consistency')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const daysParam = url.searchParams.get('days');

      // Validate and parse days parameter
      const paramsResult = QueryParamsSchema.safeParse({ days: daysParam });
      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const { days } = paramsResult.data;

      // Fetch consistency data
      const consistency = await getHabitsConsistency(days);

      // Validate response schema
      const validatedConsistency = HabitsConsistencyResponseSchema.parse(consistency);

      // Generate cache tags
      const tags = [habitsTags('consistency', days), habitsTags('consistency')];

      // Return response with cache headers
      const response = apiSuccess(validatedConsistency);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes - FREQUENT)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.FREQUENT}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching habits consistency:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch habits consistency',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
