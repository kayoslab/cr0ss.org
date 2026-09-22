import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getHabitsToday } from '@/lib/dashboard/habits';
import { berlinToday } from '@/lib/dashboard/today';

const QueryParamsSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/habits/today?date=YYYY-MM-DD — one day's habit numbers. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-today', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/today')
  .handle(async (request) => {
    try {
      const dateParam = new URL(request.url).searchParams.get('date');
      const parsed = QueryParamsSchema.safeParse(
        dateParam === null ? {} : { date: dateParam }
      );
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      const date = parsed.data.date ?? (await berlinToday());
      return privateJson(await getHabitsToday(date));
    } catch (error) {
      console.error('Error fetching habits today:', error);
      return internalError('Failed to fetch habits data', error);
    }
  });
