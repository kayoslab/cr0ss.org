import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  apiError,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getHabitsTrends, HABIT_COLUMNS } from '@/lib/dashboard/habits';

const QueryParamsSchema = z.object({
  habits: z.string().min(1),
  days: z.coerce.number().int().min(1).max(90).default(14),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/habits/trends?habits=a,b&days — daily series per habit. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-trends', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/trends')
  .handle(async (request) => {
    try {
      const q = new URL(request.url).searchParams;
      if (!q.get('habits')) {
        return apiError(
          'Missing required parameter: habits',
          400,
          'The "habits" query parameter is required',
          'VALIDATION_ERROR'
        );
      }
      const parsed = QueryParamsSchema.safeParse({
        habits: q.get('habits'),
        ...(q.get('days') !== null && { days: q.get('days') }),
      });
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );

      const habits = parsed.data.habits
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
      const invalid = habits.filter(
        (h) => !(HABIT_COLUMNS as readonly string[]).includes(h)
      );
      if (habits.length === 0) {
        return apiError(
          'Invalid habits parameter',
          400,
          'At least one habit must be specified',
          'VALIDATION_ERROR'
        );
      }
      if (invalid.length > 0) {
        return apiError(
          'Invalid habit names',
          400,
          `Invalid habits: ${invalid.join(', ')}. Valid habits: ${HABIT_COLUMNS.join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      return privateJson(
        await getHabitsTrends(habits.join(','), parsed.data.days)
      );
    } catch (error) {
      console.error('Error fetching habits trends:', error);
      return internalError('Failed to fetch habits trends', error);
    }
  });
