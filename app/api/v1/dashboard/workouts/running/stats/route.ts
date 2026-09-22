import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getRunningStats } from '@/lib/dashboard/workouts';

const QueryParamsSchema = z.object({
  period: z.enum(['month', 'year', 'all']).default('month'),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/workouts/running/stats?period — totals, pace, records, monthly goal. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-running-stats', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/workouts/running/stats')
  .handle(async (request) => {
    try {
      const period = new URL(request.url).searchParams.get('period');
      const parsed = QueryParamsSchema.safeParse(
        period === null ? {} : { period }
      );
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      return privateJson(await getRunningStats(parsed.data.period));
    } catch (error) {
      console.error('Error fetching running stats:', error);
      return internalError('Failed to fetch running stats', error);
    }
  });
