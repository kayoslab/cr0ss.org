import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getWorkoutsHeatmap } from '@/lib/dashboard/workouts';

const QueryParamsSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(60),
  workout_type: z.string().optional(),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/workouts/heatmap?days&workout_type — per-day activity grid. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-workouts-heatmap', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/workouts/heatmap')
  .handle(async (request) => {
    try {
      const q = new URL(request.url).searchParams;
      const parsed = QueryParamsSchema.safeParse({
        ...(q.get('days') !== null && { days: q.get('days') }),
        ...(q.get('workout_type') !== null && {
          workout_type: q.get('workout_type'),
        }),
      });
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      return privateJson(
        await getWorkoutsHeatmap(parsed.data.days, parsed.data.workout_type)
      );
    } catch (error) {
      console.error('Error fetching workouts heatmap:', error);
      return internalError('Failed to fetch workouts heatmap', error);
    }
  });
