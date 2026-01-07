export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { coffeeTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { qCoffeeOriginThisWeek } from '@/lib/db/queries';
import { z } from 'zod';

/**
 * Response schema for coffee origins endpoint
 */
const CoffeeOriginsResponseSchema = z.object({
  origins: z.array(
    z.object({
      name: z.string(),
      value: z.number().int().min(0),
    })
  ),
});

export type CoffeeOriginsResponse = z.infer<typeof CoffeeOriginsResponseSchema>;

/**
 * GET /api/v1/dashboard/coffee/origins
 *
 * Returns coffee origins (countries) for the last 7 days.
 *
 * Response:
 * - origins: Array of country names and cup counts
 *
 * Cache:
 * - Duration: 5 minutes (FREQUENT)
 * - Tags: coffee:origins
 *
 * Example:
 * GET /api/v1/dashboard/coffee/origins
 * {
 *   "origins": [
 *     { "name": "Ethiopia", "value": 5 },
 *     { "name": "Colombia", "value": 3 },
 *     { "name": "Kenya", "value": 2 }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-coffee-origins', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/coffee/origins')
  .handle(async (request) => {
    try {
      // Fetch coffee origins data (last 7 days)
      const origins = await qCoffeeOriginThisWeek();

      // Prepare response
      const response = {
        origins,
      };

      // Validate response schema
      const validatedResponse = CoffeeOriginsResponseSchema.parse(response);

      // Generate cache tags
      const tags = [coffeeTags('origins')];

      // Return response with cache headers
      const apiResponse = apiSuccess(validatedResponse);

      // Add cache tags via Next.js headers
      apiResponse.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes)
      apiResponse.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.FREQUENT}, stale-while-revalidate`
      );

      return apiResponse;
    } catch (error) {
      console.error('Error fetching coffee origins:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch coffee origins',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
