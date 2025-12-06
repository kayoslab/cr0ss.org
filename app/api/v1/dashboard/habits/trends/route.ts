export const runtime = 'edge';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { habitsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for habits trends endpoint
 */
const HabitsTrendsResponseSchema = z.object({
  trends: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      values: z.record(z.string(), z.number().int().min(0)),
    })
  ),
});

export type HabitsTrendsResponse = z.infer<typeof HabitsTrendsResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  habits: z.string().min(1),
  days: z.coerce.number().int().min(1).max(90).optional().default(14),
});

/**
 * Valid habit column names in the days table
 */
const VALID_HABITS = [
  'steps',
  'reading_minutes',
  'outdoor_minutes',
  'writing_minutes',
  'coding_minutes',
  'focus_minutes',
] as const;

/**
 * Get habits trends data
 *
 * @param habits - Comma-separated habit names
 * @param days - Number of days to fetch (default: 14, max: 90)
 * @returns Trend data
 */
async function getHabitsTrends(
  habits: string[],
  days: number
): Promise<HabitsTrendsResponse> {
  // Calculate start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = startDate.toISOString().slice(0, 10);

  // Build column list (sanitized)
  const columns = habits.map((h) => `COALESCE(${h}, 0)::int as ${h}`).join(', ');

  // Query with dynamic columns
  const rows = await sql/*sql*/`
    SELECT
      to_char(date, 'YYYY-MM-DD') as date,
      ${sql.unsafe(columns)}
    FROM days
    WHERE date >= ${startStr}::date
      AND date <= current_date
    ORDER BY date ASC
  `;

  interface TrendRow {
    date: string;
    [key: string]: string | number | null;
  }

  // Transform to response format
  const trends = rows.map((r) => {
    const row = r as TrendRow;
    const values: Record<string, number> = {};

    for (const habit of habits) {
      values[habit] = Number(row[habit] || 0);
    }

    return {
      date: String(row.date),
      values,
    };
  });

  return { trends };
}

/**
 * GET /api/v1/dashboard/habits/trends
 *
 * Returns time-series trends for specified habits over a period.
 *
 * Query Parameters:
 * - habits (required): Comma-separated habit names (e.g., "writing_minutes,focus_minutes")
 *   Valid values: steps, reading_minutes, outdoor_minutes, writing_minutes, coding_minutes, focus_minutes
 * - days (optional): Number of days to fetch (default: 14, max: 90)
 *
 * Response:
 * - trends: Array of daily data points
 *   - date: Date in YYYY-MM-DD format
 *   - values: Object mapping habit names to their values for that day
 *
 * Cache:
 * - Duration: 5 minutes (FREQUENT)
 * - Tags: habits:trends:{habits}:{days}, habits:trends
 *
 * Example:
 * GET /api/v1/dashboard/habits/trends?habits=writing_minutes,focus_minutes&days=7
 * {
 *   "trends": [
 *     {
 *       "date": "2025-12-01",
 *       "values": {
 *         "writing_minutes": 45,
 *         "focus_minutes": 120
 *       }
 *     },
 *     {
 *       "date": "2025-12-02",
 *       "values": {
 *         "writing_minutes": 60,
 *         "focus_minutes": 180
 *       }
 *     }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-trends', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/trends')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const habitsParam = url.searchParams.get('habits');
      const daysParam = url.searchParams.get('days');

      // Validate required parameter
      if (!habitsParam) {
        return apiError(
          'Missing required parameter: habits',
          400,
          'The "habits" query parameter is required',
          'VALIDATION_ERROR'
        );
      }

      // Validate and parse parameters
      const paramsResult = QueryParamsSchema.safeParse({
        habits: habitsParam,
        days: daysParam,
      });

      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const { habits: habitsStr, days } = paramsResult.data;

      // Parse and validate habit names
      const habits = habitsStr
        .split(',')
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      if (habits.length === 0) {
        return apiError(
          'Invalid habits parameter',
          400,
          'At least one habit must be specified',
          'VALIDATION_ERROR'
        );
      }

      // Validate that all habits are valid column names
      const invalidHabits = habits.filter((h) => !VALID_HABITS.includes(h as any));
      if (invalidHabits.length > 0) {
        return apiError(
          'Invalid habit names',
          400,
          `Invalid habits: ${invalidHabits.join(', ')}. Valid habits: ${VALID_HABITS.join(', ')}`,
          'VALIDATION_ERROR'
        );
      }

      // Fetch trends data
      const trends = await getHabitsTrends(habits, days);

      // Validate response schema
      const validatedTrends = HabitsTrendsResponseSchema.parse(trends);

      // Generate cache tags
      const tags = [habitsTags('trends', habitsStr, days), habitsTags('trends')];

      // Return response with cache headers
      const response = apiSuccess(validatedTrends);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes - FREQUENT)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.FREQUENT}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching habits trends:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch habits trends',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
