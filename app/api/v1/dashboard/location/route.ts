import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError, internalError } from '@/lib/api/responses';
import { getLocation } from '@/lib/dashboard/location';

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/location — most recent location with weather. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-location', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/location')
  .handle(async () => {
    try {
      const location = await getLocation();
      if (!location)
        return apiError(
          'No location data available',
          404,
          undefined,
          'NOT_FOUND'
        );
      return privateJson(location);
    } catch (error) {
      console.error('Error fetching location:', error);
      return internalError('Failed to fetch location', error);
    }
  });
