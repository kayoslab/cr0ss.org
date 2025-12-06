export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { habitsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for habits today endpoint
 */
const HabitsTodayResponseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().min(0),
  reading_minutes: z.number().int().min(0),
  outdoor_minutes: z.number().int().min(0),
  writing_minutes: z.number().int().min(0),
  coding_minutes: z.number().int().min(0),
  focus_minutes: z.number().int().min(0),
  sleep_score: z.number().int().min(0).max(100).optional(),
});

export type HabitsTodayResponse = z.infer<typeof HabitsTodayResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Get habits data for a specific date
 *
 * @param date - Date in YYYY-MM-DD format
 * @returns Habits data
 */
async function getHabitsToday(date: string): Promise<HabitsTodayResponse> {
  const rows = await sql/*sql*/`
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
    // No data for this date - return zeros
    return {
      date,
      steps: 0,
      reading_minutes: 0,
      outdoor_minutes: 0,
      writing_minutes: 0,
      coding_minutes: 0,
      focus_minutes: 0,
    };
  }

  const row = rows[0];
  return {
    date: String(row.date),
    steps: Number(row.steps),
    reading_minutes: Number(row.reading_minutes),
    outdoor_minutes: Number(row.outdoor_minutes),
    writing_minutes: Number(row.writing_minutes),
    coding_minutes: Number(row.coding_minutes),
    focus_minutes: Number(row.focus_minutes),
    sleep_score: row.sleep_score != null ? Number(row.sleep_score) : undefined,
  };
}

/**
 * GET /api/v1/dashboard/habits/today
 *
 * Returns habits tracking data for a specific date.
 *
 * Query Parameters:
 * - date (optional): Date in YYYY-MM-DD format. Defaults to today in Europe/Berlin timezone.
 *
 * Response:
 * - date: Date of the data (YYYY-MM-DD)
 * - steps: Step count
 * - reading_minutes: Minutes spent reading
 * - outdoor_minutes: Minutes spent outdoors
 * - writing_minutes: Minutes spent writing
 * - coding_minutes: Minutes spent coding
 * - focus_minutes: Minutes in deep focus
 * - sleep_score: Sleep quality score (optional, 0-100)
 *
 * Cache:
 * - Duration: 30 seconds (REALTIME - highest freshness priority)
 * - Tags: habits:today:{date}, habits:today
 *
 * Example:
 * GET /api/v1/dashboard/habits/today?date=2025-12-05
 * {
 *   "date": "2025-12-05",
 *   "steps": 12500,
 *   "reading_minutes": 45,
 *   "outdoor_minutes": 60,
 *   "writing_minutes": 90,
 *   "coding_minutes": 240,
 *   "focus_minutes": 180,
 *   "sleep_score": 85
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-today', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/today')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const dateParam = url.searchParams.get('date');

      // Get date - default to today in Berlin timezone if not provided
      let date: string;
      if (dateParam) {
        // Validate query parameters if provided
        const paramsResult = QueryParamsSchema.safeParse({ date: dateParam });
        if (!paramsResult.success) {
          return apiError(
            'Invalid query parameters',
            400,
            paramsResult.error.flatten(),
            'VALIDATION_ERROR'
          );
        }
        date = paramsResult.data.date!;
      } else {
        // Get current date in Europe/Berlin timezone
        const [{ current_date }] = await sql/*sql*/`
          SELECT timezone('Europe/Berlin', now())::date::text as current_date
        `;
        date = String(current_date);
      }

      // Fetch habits data
      const habits = await getHabitsToday(date);

      // Validate response schema
      const validatedHabits = HabitsTodayResponseSchema.parse(habits);

      // Generate cache tags
      const tags = [habitsTags('today', date), habitsTags('today')];

      // Return response with cache headers
      const response = apiSuccess(validatedHabits);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (30 seconds - REALTIME)
      response.headers.set(
        'Cache-Control',
        `s-maxage=30, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching habits today:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch habits data',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
