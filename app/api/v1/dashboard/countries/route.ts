import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getCountries } from '@/lib/dashboard/countries';

const QueryParamsSchema = z.object({
  visited: z.enum(['true', 'false']).optional(),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/countries?visited=true|false — travel-map countries. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-countries', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/countries')
  .handle(async (request) => {
    try {
      const visited = new URL(request.url).searchParams.get('visited');
      const parsed = QueryParamsSchema.safeParse(
        visited === null ? {} : { visited }
      );
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      const filter =
        parsed.data.visited === undefined
          ? 'all'
          : parsed.data.visited === 'true'
            ? 'visited'
            : 'unvisited';
      return privateJson(await getCountries(filter));
    } catch (error) {
      console.error('Error fetching countries:', error);
      return internalError('Failed to fetch countries', error);
    }
  });
