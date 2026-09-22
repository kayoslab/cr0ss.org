import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { getHabitsStreaks } from '@/lib/dashboard/habits';

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/habits/streaks — current and longest streak per habit. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-streaks', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/streaks')
  .handle(async () => {
    try {
      return privateJson(await getHabitsStreaks());
    } catch (error) {
      console.error('Error fetching habits streaks:', error);
      return internalError('Failed to fetch habits streaks', error);
    }
  });
