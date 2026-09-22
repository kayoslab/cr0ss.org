import { createApiRoute } from '@/lib/api/middleware';
import {
  apiSuccess,
  validationError,
  internalError,
} from '@/lib/api/responses';
import { z } from 'zod';
import { getInsights } from '@/lib/dashboard/insights';

const QueryParamsSchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(90),
  p_value_threshold: z.coerce.number().min(0).max(1).default(0.1),
  min_abs_r: z.coerce.number().min(0).max(1).default(0.3),
});

/** Secret-gated response: never CDN-cache it (the data cache lives in lib/dashboard). */
function privateJson<T>(data: T) {
  const response = apiSuccess(data);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

/** GET /api/v1/dashboard/insights?days&p_value_threshold&min_abs_r — discovered correlations. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-insights', { windowSec: 60, max: 10 })
  .withTrace('GET /api/v1/dashboard/insights')
  .handle(async (request) => {
    try {
      const q = new URL(request.url).searchParams;
      const parsed = QueryParamsSchema.safeParse({
        ...(q.get('days') !== null && { days: q.get('days') }),
        ...(q.get('p_value_threshold') !== null && {
          p_value_threshold: q.get('p_value_threshold'),
        }),
        ...(q.get('min_abs_r') !== null && { min_abs_r: q.get('min_abs_r') }),
      });
      if (!parsed.success)
        return validationError(
          'Invalid query parameters',
          parsed.error.flatten()
        );
      const { days, p_value_threshold, min_abs_r } = parsed.data;
      return privateJson(await getInsights(days, p_value_threshold, min_abs_r));
    } catch (error) {
      console.error('Error discovering correlations:', error);
      return internalError('Failed to discover correlations', error);
    }
  });
