export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { habitsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { getHabitsDashboardData } from '@/lib/db/dashboard/habits';
import { z } from 'zod';

/**
 * Response schema for sleep quality endpoint
 */
const SleepQualityResponseSchema = z.object({
  data: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      sleep_score: z.number().int().min(0).max(100),
      prev_caffeine_mg: z.number().int().min(0),
      prev_day_workout: z.boolean(),
    })
  ),
});

export type SleepQualityResponse = z.infer<typeof SleepQualityResponseSchema>;

/**
 * GET /api/v1/dashboard/habits/sleep-quality
 *
 * Returns sleep quality data correlated with previous day caffeine and workout data.
 * Analyzes the relationship between sleep quality and caffeine consumption at midnight
 * (residual caffeine in the body) and whether a workout occurred the previous day.
 *
 * Response:
 * - data: Array of daily sleep quality records with:
 *   - date: Date of the sleep record (YYYY-MM-DD)
 *   - sleep_score: Sleep quality score (0-100)
 *   - prev_caffeine_mg: Estimated caffeine in body at midnight (mg)
 *   - prev_day_workout: Whether a workout occurred the previous day
 *
 * Cache:
 * - Duration: 5 minutes (MEDIUM freshness)
 * - Tags: habits:sleep-quality, habits
 *
 * Example:
 * GET /api/v1/dashboard/habits/sleep-quality
 * {
 *   "data": [
 *     {
 *       "date": "2025-12-05",
 *       "sleep_score": 85,
 *       "prev_caffeine_mg": 23,
 *       "prev_day_workout": true
 *     }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-sleep', { windowSec: 60, max: 20 })
  .withTrace('GET /api/v1/dashboard/habits/sleep-quality')
  .handle(async () => {
    try {
      // Fetch habits dashboard data (includes sleep quality calculations)
      const habitsData = await getHabitsDashboardData();

      // Extract sleep quality data
      const sleepQualityData = {
        data: habitsData.sleepPrevCaff,
      };

      // Validate response schema
      const validatedData = SleepQualityResponseSchema.parse(sleepQualityData);

      // Generate cache tags
      const tags = [habitsTags('sleep-quality'), habitsTags()];

      // Return response with cache headers
      const response = apiSuccess(validatedData);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes - MEDIUM freshness)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.MEDIUM}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching sleep quality data:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch sleep quality data',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
