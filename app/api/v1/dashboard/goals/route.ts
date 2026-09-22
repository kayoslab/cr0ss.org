import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { getGoals } from '@/lib/dashboard/goals';

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/goals — this month's daily and monthly targets. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-goals', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/goals')
  .handle(async () => {
    try {
      return privateJson(await getGoals());
    } catch (error) {
      console.error('Error fetching goals:', error);
      return internalError('Failed to fetch goals', error);
    }
  });
