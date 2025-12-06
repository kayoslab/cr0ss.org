export const runtime = 'edge';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { coffeeTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';
import { startOfBerlinDayISO, endOfBerlinDayISO, toBerlinYMD } from '@/lib/time/berlin';
import { getBodyProfile } from '@/lib/user/profile';
import { modelCaffeine } from '@/lib/phys/caffeine';
import { qCoffeeEventsForDayWithLookback } from '@/lib/db/queries';

/**
 * Response schema for caffeine curve endpoint
 */
const CaffeineCurveResponseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  series: z.array(
    z.object({
      time: z.string(), // ISO timestamp (Berlin timezone)
      intake_mg: z.number().int().min(0), // Cumulative intake
      body_mg: z.number().int().min(0), // Modeled body caffeine level
    })
  ),
  body_profile: z.object({
    half_life_hours: z.number(),
    sensitivity: z.number(),
    bioavailability: z.number(),
  }),
});

export type CaffeineCurveResponse = z.infer<typeof CaffeineCurveResponseSchema>;

/**
 * Query parameters schema
 */
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ResolutionSchema = z.coerce.number().int().min(15).max(240);

/**
 * Get caffeine curve data for a specific date
 *
 * @param date - Date in YYYY-MM-DD format
 * @param resolution - Minutes between data points (default: 60)
 * @returns Caffeine curve data
 */
async function getCaffeineCurve(
  date: string,
  resolution: number
): Promise<CaffeineCurveResponse> {
  // Get body profile for caffeine modeling
  const body = await getBodyProfile();

  // Calculate day boundaries in Berlin timezone
  const dateObj = new Date(`${date}T12:00:00.000Z`);
  const startISO = startOfBerlinDayISO(dateObj); // Today 00:00 Berlin (in UTC)
  const endISO = endOfBerlinDayISO(dateObj); // Tomorrow 00:00 Berlin (in UTC)

  // Calculate lookback period for caffeine decay
  const half = body.half_life_hours ?? 5;
  const lookbackH = Math.max(24, Math.ceil(half * 4)); // At least 24h or 4 half-lives

  // Fetch coffee events with lookback
  const events = await qCoffeeEventsForDayWithLookback(startISO, endISO, lookbackH);

  // Model caffeine curve
  const caffeineSeries = modelCaffeine(events, body, {
    startMs: Date.parse(startISO),
    endMs: Date.parse(endISO),
    alignToHour: true, // Align grid points to Berlin hour boundaries
    gridMinutes: resolution,
    halfLifeHours: body.half_life_hours ?? undefined,
  });

  // Transform to response format
  const series = caffeineSeries.map((point) => ({
    time: point.timeISO,
    intake_mg: point.intake_mg,
    body_mg: point.body_mg,
  }));

  return {
    date,
    series,
    body_profile: {
      half_life_hours: body.half_life_hours ?? 5,
      sensitivity: body.caffeine_sensitivity ?? 1.0,
      bioavailability: body.bioavailability ?? 0.9,
    },
  };
}

/**
 * GET /api/v1/dashboard/coffee/caffeine-curve
 *
 * Returns caffeine curve showing intake and body levels throughout the day.
 *
 * Query Parameters:
 * - date (optional): Date in YYYY-MM-DD format. Defaults to today in Europe/Berlin timezone.
 * - resolution (optional): Minutes between data points (default: 60, min: 15, max: 240)
 *
 * Response:
 * - date: Date of the caffeine curve (YYYY-MM-DD)
 * - series: Array of time series data points with intake and body caffeine levels
 * - body_profile: User's caffeine metabolism parameters
 *
 * Cache:
 * - Duration: 1 minute (REALTIME)
 * - Tags: coffee:caffeine:{date}, coffee:caffeine
 *
 * Example:
 * GET /api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05&resolution=60
 * {
 *   "date": "2025-12-05",
 *   "series": [
 *     { "time": "2025-12-05T00:00:00.000Z", "intake_mg": 0, "body_mg": 25 },
 *     { "time": "2025-12-05T01:00:00.000Z", "intake_mg": 0, "body_mg": 20 },
 *     { "time": "2025-12-05T08:00:00.000Z", "intake_mg": 80, "body_mg": 85 }
 *   ],
 *   "body_profile": {
 *     "half_life_hours": 5,
 *     "sensitivity": 1.0,
 *     "bioavailability": 0.9
 *   }
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-coffee-caffeine-curve', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/coffee/caffeine-curve')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const dateParam = url.searchParams.get('date');
      const resolutionParam = url.searchParams.get('resolution');

      // Get date - default to today in Berlin timezone if not provided
      let date: string;
      if (dateParam) {
        const dateResult = DateSchema.safeParse(dateParam);
        if (!dateResult.success) {
          return apiError(
            'Invalid date parameter',
            400,
            dateResult.error.flatten(),
            'VALIDATION_ERROR'
          );
        }
        date = dateResult.data;
      } else {
        // Get current date in Europe/Berlin timezone
        const [{ current_date }] = await sql/*sql*/`
          SELECT timezone('Europe/Berlin', now())::date::text as current_date
        `;
        date = String(current_date);
      }

      // Get resolution - default to 60 if not provided
      let resolution = 60;
      if (resolutionParam) {
        const resolutionResult = ResolutionSchema.safeParse(resolutionParam);
        if (!resolutionResult.success) {
          return apiError(
            'Invalid resolution parameter',
            400,
            resolutionResult.error.flatten(),
            'VALIDATION_ERROR'
          );
        }
        resolution = resolutionResult.data;
      }

      // Fetch caffeine curve data
      const curveData = await getCaffeineCurve(date, resolution);

      // Validate response schema
      const validatedData = CaffeineCurveResponseSchema.parse(curveData);

      // Generate cache tags
      const tags = [coffeeTags('caffeine', date), coffeeTags('caffeine')];

      // Return response with cache headers
      const response = apiSuccess(validatedData);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (1 minute)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.REALTIME}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching caffeine curve:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch caffeine curve',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
