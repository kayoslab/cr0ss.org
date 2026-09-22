import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getCaffeineCurve } from '@/lib/dashboard/coffee';
import { berlinToday } from '@/lib/dashboard/today';

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ResolutionSchema = z.coerce.number().int().min(15).max(240);

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/coffee/caffeine-curve?date&resolution — modelled intake and body level. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-coffee-caffeine-curve', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/coffee/caffeine-curve')
  .handle(async (request) => {
    try {
      const q = new URL(request.url).searchParams;
      let date: string;
      if (q.get('date') !== null) {
        const parsed = DateSchema.safeParse(q.get('date'));
        if (!parsed.success)
          return validationError(
            'Invalid date parameter',
            parsed.error.flatten()
          );
        date = parsed.data;
      } else {
        date = await berlinToday();
      }
      let resolution = 60;
      if (q.get('resolution') !== null) {
        const parsed = ResolutionSchema.safeParse(q.get('resolution'));
        if (!parsed.success)
          return validationError(
            'Invalid resolution parameter',
            parsed.error.flatten()
          );
        resolution = parsed.data;
      }
      return privateJson(await getCaffeineCurve(date, resolution));
    } catch (error) {
      console.error('Error fetching caffeine curve:', error);
      return internalError('Failed to fetch caffeine curve', error);
    }
  });
