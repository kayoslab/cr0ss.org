import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { getSleepQuality } from '@/lib/dashboard/habits';

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/habits/sleep-quality — sleep score vs residual caffeine at midnight. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-sleep', { windowSec: 60, max: 20 })
  .withTrace('GET /api/v1/dashboard/habits/sleep-quality')
  .handle(async () => {
    try {
      return privateJson(await getSleepQuality());
    } catch (error) {
      console.error('Error fetching sleep quality data:', error);
      return internalError('Failed to fetch sleep quality data', error);
    }
  });
