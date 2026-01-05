export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { dashboardTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { getAllCoffeeDTO } from '@/lib/contentful/api/coffee';
import { z } from 'zod';

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/**
 * Response schema for coffee config endpoint
 */
const CoffeeConfigItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  roaster: z.string(),
});

const CoffeeConfigResponseSchema = z.object({
  items: z.array(CoffeeConfigItemSchema),
});

export type CoffeeConfigResponse = z.infer<typeof CoffeeConfigResponseSchema>;

/**
 * GET /api/v1/dashboard/settings/coffee
 *
 * Returns coffee configuration data from Contentful for settings/selection purposes.
 *
 * Query Parameters:
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Number of items per page (default: 20, max: 100)
 *
 * Response:
 * - items: Array of coffee configuration objects
 *
 * Cache:
 * - Duration: 1 hour (STABLE) - Coffee config data changes infrequently
 * - Tags: dashboard:settings:coffee
 *
 * Example:
 * GET /api/v1/dashboard/settings/coffee?page=1&limit=20
 * {
 *   "items": [
 *     {
 *       "id": "abc123",
 *       "name": "Ethiopian Yirgacheffe",
 *       "roaster": "Local Roasters"
 *     }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-settings-coffee', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/settings/coffee')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const pageParam = url.searchParams.get('page');
      const limitParam = url.searchParams.get('limit');

      // Validate query parameters
      const paramsResult = QueryParamsSchema.safeParse({
        page: pageParam,
        limit: limitParam,
      });

      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const { page, limit } = paramsResult.data;

      // Fetch coffee config from Contentful
      const coffeeData = await getAllCoffeeDTO(page, limit);

      const response = {
        items: coffeeData.items,
      };

      // Validate response schema
      const validatedResponse = CoffeeConfigResponseSchema.parse(response);

      // Generate cache tags
      const tags = [dashboardTags('settings', 'coffee')];

      // Return response with cache headers
      const apiResponse = apiSuccess(validatedResponse);

      // Add cache tags via Next.js headers
      apiResponse.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (1 hour - config data changes infrequently)
      apiResponse.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.STABLE}, stale-while-revalidate`
      );

      return apiResponse;
    } catch (error) {
      console.error('Error fetching coffee config:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch coffee configuration',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
