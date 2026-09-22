import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getCoffeeTimeline } from '@/lib/dashboard/coffee';

const QueryParamsSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/coffee/timeline?start_date&end_date&granularity — cups per period. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-coffee-timeline', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/coffee/timeline')
  .handle(async (request) => {
    try {
      const q = new URL(request.url).searchParams;
      const parsed = QueryParamsSchema.safeParse({
        start_date: q.get('start_date'),
        end_date: q.get('end_date'),
        granularity: q.get('granularity') || 'day',
      });
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      const { start_date, end_date, granularity } = parsed.data;
      return privateJson(
        await getCoffeeTimeline(start_date, end_date, granularity)
      );
    } catch (error) {
      console.error('Error fetching coffee timeline:', error);
      return internalError('Failed to fetch coffee timeline', error);
    }
  });
