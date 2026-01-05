export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { insightsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { discoverCorrelations } from '@/lib/insights/correlation-discovery';
import { z } from 'zod';

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  days: z.coerce.number().int().min(7).max(365).optional().default(90),
  p_value_threshold: z.coerce.number().min(0).max(1).optional().default(0.1),
  min_abs_r: z.coerce.number().min(0).max(1).optional().default(0.3),
});

// Note: We don't validate the full response schema with Zod because
// DiscoveredCorrelation comes from the correlation-discovery module
// and already has proper TypeScript types. The response structure is
// simple enough that runtime validation isn't necessary here.

/**
 * GET /api/v1/dashboard/insights
 *
 * Returns discovered correlations between quantified self metrics.
 * This endpoint wraps expensive correlation analysis (7+ table joins + statistical calculations)
 * with aggressive caching to ensure acceptable performance.
 *
 * Query Parameters:
 * - days (optional): Number of days to analyze (7-365, default: 90)
 * - p_value_threshold (optional): Maximum p-value for significance (0-1, default: 0.1)
 * - min_abs_r (optional): Minimum absolute correlation coefficient (0-1, default: 0.3)
 *
 * Response:
 * - correlations: Array of discovered correlation insights
 * - metadata: Analysis parameters and statistics
 *
 * Cache:
 * - Duration: 15 minutes (STANDARD) - Expensive query, aggressive caching
 * - Tags: insights:correlations:{days}, insights:correlations
 * - Rate limit: 10 req/min (lower due to computational expense)
 *
 * Example:
 * GET /api/v1/dashboard/insights?days=90&p_value_threshold=0.05&min_abs_r=0.4
 * {
 *   "correlations": [
 *     {
 *       "metricA": { "key": "sleepScore", "label": "Sleep Score", ... },
 *       "metricB": { "key": "mood", "label": "Mood", ... },
 *       "correlation": { "r": 0.65, "pValue": 0.001, "confidence": "strong", ... },
 *       "dateRange": { "start": "2024-10-07", "end": "2025-01-05" },
 *       "interpretation": "When Sleep Score goes up, Mood tends to increase..."
 *     }
 *   ],
 *   "metadata": {
 *     "days_analyzed": 90,
 *     "min_correlation": 0.4,
 *     "p_value_threshold": 0.05
 *   }
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-insights', { windowSec: 60, max: 10 })
  .withTrace('GET /api/v1/dashboard/insights')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const daysParam = url.searchParams.get('days');
      const pValueParam = url.searchParams.get('p_value_threshold');
      const minAbsRParam = url.searchParams.get('min_abs_r');

      // Validate query parameters
      const paramsResult = QueryParamsSchema.safeParse({
        days: daysParam,
        p_value_threshold: pValueParam,
        min_abs_r: minAbsRParam,
      });

      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const { days, p_value_threshold, min_abs_r } = paramsResult.data;

      // Execute expensive correlation discovery query
      // This performs 7+ table joins and statistical calculations
      const correlations = await discoverCorrelations({
        days,
        pValueThreshold: p_value_threshold,
        minAbsR: min_abs_r,
      });

      const response = {
        correlations,
        metadata: {
          days_analyzed: days,
          min_correlation: min_abs_r,
          p_value_threshold,
        },
      };

      // Generate cache tags
      const tags = [insightsTags('correlations', days), insightsTags('correlations')];

      // Return response with cache headers
      const apiResponse = apiSuccess(response);

      // Add cache tags via Next.js headers
      apiResponse.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (15 minutes - expensive query)
      apiResponse.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.STANDARD}, stale-while-revalidate`
      );

      return apiResponse;
    } catch (error) {
      console.error('Error discovering correlations:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to discover correlations',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
