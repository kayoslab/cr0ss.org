export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { coffeeTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for coffee timeline endpoint
 */
const CoffeeTimelineResponseSchema = z.object({
  timeline: z.array(
    z.object({
      period: z.string(), // YYYY-MM-DD or YYYY-Www or YYYY-MM
      cups_count: z.number().int().min(0),
      avg_caffeine_mg: z.number().min(0),
    })
  ),
  total_cups: z.number().int().min(0),
  avg_cups_per_day: z.number().min(0),
});

export type CoffeeTimelineResponse = z.infer<typeof CoffeeTimelineResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
});

/**
 * Default caffeine content per brew type (mg per standard serving)
 */
const DEFAULT_CAFFEINE_MG: Record<string, number> = {
  espresso: 80,
  v60: 120,
  chemex: 200,
  moka: 100,
  aero: 110,
  cold_brew: 150,
  other: 90,
};

/**
 * Get coffee timeline data for a date range
 *
 * @param start_date - Start date (YYYY-MM-DD)
 * @param end_date - End date (YYYY-MM-DD)
 * @param granularity - Time period granularity
 * @returns Coffee timeline data
 */
async function getCoffeeTimeline(
  start_date: string,
  end_date: string,
  granularity: 'day' | 'week' | 'month'
): Promise<CoffeeTimelineResponse> {
  // Validate date range
  const startMs = Date.parse(start_date);
  const endMs = Date.parse(end_date);
  if (startMs > endMs) {
    throw new Error('start_date must be before or equal to end_date');
  }

  // Build SQL based on granularity
  let dateFormat: string;
  let groupBy: string;

  switch (granularity) {
    case 'day':
      dateFormat = 'YYYY-MM-DD';
      groupBy = 'date';
      break;
    case 'week':
      dateFormat = 'IYYY-"W"IW'; // ISO week format (YYYY-Www)
      groupBy = 'date_trunc(\'week\', date)';
      break;
    case 'month':
      dateFormat = 'YYYY-MM';
      groupBy = 'date_trunc(\'month\', date)';
      break;
  }

  // Query timeline data
  const timelineRows = await sql/*sql*/`
    SELECT
      to_char(${sql.unsafe(groupBy)}, ${dateFormat}) as period,
      COUNT(*)::int as cups_count,
      AVG(
        CASE type::text
          WHEN 'espresso' THEN ${DEFAULT_CAFFEINE_MG.espresso}::numeric
          WHEN 'v60' THEN ${DEFAULT_CAFFEINE_MG.v60}::numeric
          WHEN 'chemex' THEN ${DEFAULT_CAFFEINE_MG.chemex}::numeric
          WHEN 'moka' THEN ${DEFAULT_CAFFEINE_MG.moka}::numeric
          WHEN 'aero' THEN ${DEFAULT_CAFFEINE_MG.aero}::numeric
          WHEN 'cold_brew' THEN ${DEFAULT_CAFFEINE_MG.cold_brew}::numeric
          ELSE ${DEFAULT_CAFFEINE_MG.other}::numeric
        END
      )::numeric as avg_caffeine_mg
    FROM coffee_log
    WHERE date >= ${start_date}::date
      AND date <= ${end_date}::date
    GROUP BY ${sql.unsafe(groupBy)}
    ORDER BY ${sql.unsafe(groupBy)} ASC
  `;

  interface TimelineRow {
    period: string;
    cups_count: number;
    avg_caffeine_mg: string | number;
  }

  const timeline = timelineRows.map((r) => {
    const row = r as TimelineRow;
    return {
      period: String(row.period),
      cups_count: Number(row.cups_count),
      avg_caffeine_mg: Math.round(Number(row.avg_caffeine_mg)),
    };
  });

  // Calculate summary statistics
  const total_cups = timeline.reduce((sum, t) => sum + t.cups_count, 0);

  // Calculate number of days in range for avg_cups_per_day
  const daysDiff = Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1; // inclusive
  const avg_cups_per_day = daysDiff > 0 ? Number((total_cups / daysDiff).toFixed(2)) : 0;

  return {
    timeline,
    total_cups,
    avg_cups_per_day,
  };
}

/**
 * GET /api/v1/dashboard/coffee/timeline
 *
 * Returns coffee consumption timeline for a date range.
 *
 * Query Parameters:
 * - start_date (required): Start date in YYYY-MM-DD format
 * - end_date (required): End date in YYYY-MM-DD format
 * - granularity (optional): Time period granularity - day | week | month (default: day)
 *
 * Response:
 * - timeline: Array of time periods with cup count and average caffeine
 * - total_cups: Total number of cups in the range
 * - avg_cups_per_day: Average cups per day in the range
 *
 * Cache:
 * - Duration: 5 minutes (STANDARD)
 * - Tags: coffee:timeline:{start}:{end}:{granularity}, coffee:timeline
 *
 * Example:
 * GET /api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05&granularity=day
 * {
 *   "timeline": [
 *     { "period": "2025-12-01", "cups_count": 3, "avg_caffeine_mg": 100 },
 *     { "period": "2025-12-02", "cups_count": 2, "avg_caffeine_mg": 95 }
 *   ],
 *   "total_cups": 5,
 *   "avg_cups_per_day": 1.67
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-coffee-timeline', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/coffee/timeline')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const start_date = url.searchParams.get('start_date');
      const end_date = url.searchParams.get('end_date');
      const granularity = url.searchParams.get('granularity') || 'day';

      // Validate query parameters
      const paramsResult = QueryParamsSchema.safeParse({
        start_date,
        end_date,
        granularity,
      });

      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const { start_date: validStartDate, end_date: validEndDate, granularity: validGranularity } =
        paramsResult.data;

      // Fetch timeline data
      const timelineData = await getCoffeeTimeline(
        validStartDate,
        validEndDate,
        validGranularity
      );

      // Validate response schema
      const validatedData = CoffeeTimelineResponseSchema.parse(timelineData);

      // Generate cache tags
      const tags = [
        coffeeTags('timeline', validStartDate, validEndDate, validGranularity),
        coffeeTags('timeline'),
      ];

      // Return response with cache headers
      const response = apiSuccess(validatedData);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.FREQUENT}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching coffee timeline:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch coffee timeline',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
