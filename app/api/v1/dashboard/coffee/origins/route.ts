import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, internalError } from '@/lib/api/responses';
import { getCoffeeOrigins } from '@/lib/dashboard/coffee';

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/coffee/origins — coffee origin countries, last 7 days. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-coffee-origins', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/coffee/origins')
  .handle(async () => {
    try {
      return privateJson(await getCoffeeOrigins());
    } catch (error) {
      console.error('Error fetching coffee origins:', error);
      return internalError('Failed to fetch coffee origins', error);
    }
  });
