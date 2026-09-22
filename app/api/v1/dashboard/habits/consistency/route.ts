import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getHabitsConsistency } from '@/lib/dashboard/habits';

const QueryParamsSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/habits/consistency?days — share of days each target was met. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-consistency', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/consistency')
  .handle(async (request) => {
    try {
      const days = new URL(request.url).searchParams.get('days');
      const parsed = QueryParamsSchema.safeParse(days === null ? {} : { days });
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      return privateJson(await getHabitsConsistency(parsed.data.days));
    } catch (error) {
      console.error('Error fetching habits consistency:', error);
      return internalError('Failed to fetch habits consistency', error);
    }
  });
