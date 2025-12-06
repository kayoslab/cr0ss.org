export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { coffeeTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for coffee summary endpoint
 */
const CoffeeSummaryResponseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cups: z.number().int().min(0),
  brewMethods: z.array(
    z.object({
      type: z.string(),
      count: z.number().int().min(0),
    })
  ),
});

export type CoffeeSummaryResponse = z.infer<typeof CoffeeSummaryResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Get coffee summary for a specific date
 *
 * @param date - Date in YYYY-MM-DD format
 * @returns Coffee summary data
 */
async function getCoffeeSummary(date: string): Promise<CoffeeSummaryResponse> {
  // Query for total cups on the specified date
  const [cupsResult] = await sql/*sql*/`
    SELECT COUNT(*)::int as cups
    FROM coffee_log
    WHERE date = ${date}::date
  `;
  const cups = Number(cupsResult.cups) || 0;

  // Query for brew methods breakdown
  const brewMethodsRows = await sql/*sql*/`
    SELECT type::text, COUNT(*)::int as count
    FROM coffee_log
    WHERE date = ${date}::date
    GROUP BY type
    ORDER BY count DESC
  `;

  const brewMethods = brewMethodsRows.map((r) => ({
    type: String(r.type),
    count: Number(r.count),
  }));

  return {
    date,
    cups,
    brewMethods,
  };
}

/**
 * GET /api/v1/dashboard/coffee/summary
 *
 * Returns coffee consumption summary for a specific date.
 *
 * Query Parameters:
 * - date (optional): Date in YYYY-MM-DD format. Defaults to today in Europe/Berlin timezone.
 *
 * Response:
 * - date: Date of the summary (YYYY-MM-DD)
 * - cups: Total number of cups consumed
 * - brewMethods: Array of brew method types and their counts
 *
 * Cache:
 * - Duration: 1 minute (REALTIME)
 * - Tags: coffee:summary:{date}, coffee:summary
 *
 * Example:
 * GET /api/v1/dashboard/coffee/summary?date=2025-12-05
 * {
 *   "date": "2025-12-05",
 *   "cups": 3,
 *   "brewMethods": [
 *     { "type": "espresso", "count": 2 },
 *     { "type": "v60", "count": 1 }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-coffee-summary', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/coffee/summary')
  .handle(async (request) => {
    // Direct auth check as fallback (in case middleware chain doesn't execute)
    const { hasValidSecret } = await import('@/lib/auth/secret');
    if (!hasValidSecret(request)) {
      console.error('[Route Handler] Direct auth check failed');
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    console.log('[Route Handler] Direct auth check passed');

    try {
      // Parse query parameters
      const url = new URL(request.url);
      const dateParam = url.searchParams.get('date');

      // Get date - default to today in Berlin timezone if not provided
      let date: string;
      if (dateParam) {
        // Validate query parameters if provided
        const paramsResult = QueryParamsSchema.safeParse({ date: dateParam });
        if (!paramsResult.success) {
          return apiError(
            'Invalid query parameters',
            400,
            paramsResult.error.flatten(),
            'VALIDATION_ERROR'
          );
        }
        date = paramsResult.data.date!;
      } else {
        // Get current date in Europe/Berlin timezone
        const [{ current_date }] = await sql/*sql*/`
          SELECT timezone('Europe/Berlin', now())::date::text as current_date
        `;
        date = String(current_date);
      }

      // Fetch coffee summary data
      const summary = await getCoffeeSummary(date);

      // Validate response schema
      const validatedSummary = CoffeeSummaryResponseSchema.parse(summary);

      // Generate cache tags
      const tags = [coffeeTags('summary', date), coffeeTags('summary')];

      // Return response with cache headers
      const response = apiSuccess(validatedSummary);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (1 minute)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.REALTIME}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching coffee summary:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch coffee summary',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
