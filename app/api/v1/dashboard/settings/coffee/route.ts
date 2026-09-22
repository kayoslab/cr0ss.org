import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getCoffeeConfig } from '@/lib/dashboard/settings';

const QueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/settings/coffee?page&limit — coffee catalogue for the settings form. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-settings-coffee', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/settings/coffee')
  .handle(async (request) => {
    try {
      const q = new URL(request.url).searchParams;
      const parsed = QueryParamsSchema.safeParse({
        ...(q.get('page') !== null && { page: q.get('page') }),
        ...(q.get('limit') !== null && { limit: q.get('limit') }),
      });
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      return privateJson(
        await getCoffeeConfig(parsed.data.page, parsed.data.limit)
      );
    } catch (error) {
      console.error('Error fetching coffee config:', error);
      return internalError('Failed to fetch coffee configuration', error);
    }
  });
