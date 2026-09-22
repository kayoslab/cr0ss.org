import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getGoalsProgress } from '@/lib/dashboard/goals';

const QueryParamsSchema = z.object({
  period: z.enum(['daily', 'monthly']).optional(),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/goals/progress?period — progress against each goal. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-goals-progress', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/goals/progress')
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
      return privateJson(await getGoalsProgress(parsed.data.period));
    } catch (error) {
      console.error('Error fetching goals progress:', error);
      return internalError('Failed to fetch goals progress', error);
    }
  });
