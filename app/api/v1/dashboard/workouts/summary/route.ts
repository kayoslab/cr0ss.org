import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getWorkoutsSummary } from '@/lib/dashboard/workouts';

const QueryParamsSchema = z.object({
  period: z.enum(['today', 'week', 'month']).default('month'),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/workouts/summary?period — counts, durations and streaks. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-workouts-summary', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/workouts/summary')
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
      return privateJson(await getWorkoutsSummary(parsed.data.period));
    } catch (error) {
      console.error('Error fetching workouts summary:', error);
      return internalError('Failed to fetch workouts summary', error);
    }
  });
