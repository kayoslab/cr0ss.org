export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { workoutsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for workouts heatmap endpoint
 */
const WorkoutsHeatmapResponseSchema = z.object({
  heatmap: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      duration_min: z.number().int().min(0),
      distance_km: z.number().min(0).optional(),
      workouts: z.array(
        z.object({
          type: z.string(),
          duration_min: z.number().int().min(0),
        })
      ),
    })
  ),
  stats: z.object({
    active_days: z.number().int().min(0),
    total_duration_min: z.number().int().min(0),
    avg_duration_min: z.number().min(0),
  }),
});

export type WorkoutsHeatmapResponse = z.infer<typeof WorkoutsHeatmapResponseSchema>;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
  workout_type: z.string().optional(),
});

/**
 * Get workouts heatmap for a specific period
 *
 * @param days - Number of days to include
 * @param workoutType - Optional workout type filter
 * @returns Workouts heatmap data
 */
async function getWorkoutsHeatmap(
  days: number,
  workoutType?: string
): Promise<WorkoutsHeatmapResponse> {
  // Get current date in Berlin timezone
  const [{ current_date }] = await sql/*sql*/`
    SELECT timezone('Europe/Berlin', now())::date::text as current_date
  `;

  // Calculate start date
  const [{ start_date }] = await sql/*sql*/`
    SELECT (${current_date}::date - interval '1 day' * (${days} - 1))::date::text as start_date
  `;

  // Query for individual workouts (not aggregated)
  let workoutRows;
  if (workoutType) {
    workoutRows = await sql/*sql*/`
      SELECT
        date::text,
        workout_type,
        duration_min::int
      FROM workouts
      WHERE date >= ${start_date}::date
        AND date <= ${current_date}::date
        AND workout_type = ${workoutType}
      ORDER BY date ASC, workout_type ASC
    `;
  } else {
    workoutRows = await sql/*sql*/`
      SELECT
        date::text,
        workout_type,
        duration_min::int
      FROM workouts
      WHERE date >= ${start_date}::date
        AND date <= ${current_date}::date
      ORDER BY date ASC, workout_type ASC
    `;
  }

  // Group workouts by date
  interface WorkoutRow {
    date: string;
    workout_type: string;
    duration_min: number;
  }

  const workoutsByDate = new Map<
    string,
    Array<{ type: string; duration_min: number }>
  >();

  for (const row of workoutRows) {
    const r = row as WorkoutRow;
    const dateStr = String(r.date);
    const workout = {
      type: String(r.workout_type),
      duration_min: Number(r.duration_min),
    };

    if (!workoutsByDate.has(dateStr)) {
      workoutsByDate.set(dateStr, []);
    }
    workoutsByDate.get(dateStr)!.push(workout);
  }

  // Generate complete heatmap with all dates (including zeros)
  const heatmap: Array<{
    date: string;
    duration_min: number;
    distance_km?: number;
    workouts: Array<{ type: string; duration_min: number }>;
  }> = [];

  for (let i = 0; i < days; i++) {
    const [{ date }] = await sql/*sql*/`
      SELECT (${start_date}::date + interval '1 day' * ${i})::date::text as date
    `;
    const dateStr = String(date);
    const workouts = workoutsByDate.get(dateStr) || [];
    const duration_min = workouts.reduce((sum, w) => sum + w.duration_min, 0);

    heatmap.push({
      date: dateStr,
      duration_min,
      workouts,
    });
  }

  // Calculate stats
  const active_days = heatmap.filter((d) => d.duration_min > 0).length;
  const total_duration_min = heatmap.reduce((sum, d) => sum + d.duration_min, 0);
  const avg_duration_min = active_days > 0 ? total_duration_min / active_days : 0;

  return {
    heatmap,
    stats: {
      active_days,
      total_duration_min,
      avg_duration_min,
    },
  };
}

/**
 * GET /api/v1/dashboard/workouts/heatmap
 *
 * Returns workouts heatmap data for visualization.
 *
 * Query Parameters:
 * - days (optional): Number of days to include (default: 60, max: 365)
 * - workout_type (optional): Filter by workout type (e.g., running, climbing)
 *
 * Response:
 * - heatmap: Array of dates with duration and optional distance
 * - stats: Summary statistics (active days, total/avg duration)
 *
 * Cache:
 * - Duration: 5 minutes (FREQUENT)
 * - Tags: workouts:heatmap:{days}:{type}, workouts:heatmap
 *
 * Example:
 * GET /api/v1/dashboard/workouts/heatmap?days=60&workout_type=running
 * {
 *   "heatmap": [
 *     { "date": "2025-10-06", "duration_min": 45, "distance_km": 8.5 },
 *     { "date": "2025-10-07", "duration_min": 0, "distance_km": 0 }
 *   ],
 *   "stats": {
 *     "active_days": 30,
 *     "total_duration_min": 1500,
 *     "avg_duration_min": 50
 *   }
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-workouts-heatmap', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/workouts/heatmap')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const daysParam = url.searchParams.get('days');
      const workoutTypeParam = url.searchParams.get('workout_type');

      // Validate query parameters (convert null to undefined for optional fields)
      const paramsResult = QueryParamsSchema.safeParse({
        ...(daysParam !== null && { days: daysParam }),
        ...(workoutTypeParam !== null && { workout_type: workoutTypeParam }),
      });

      if (!paramsResult.success) {
        return apiError(
          'Invalid query parameters',
          400,
          paramsResult.error.flatten(),
          'VALIDATION_ERROR'
        );
      }

      const days = paramsResult.data.days || 60;
      const workoutType = paramsResult.data.workout_type;

      // Fetch heatmap data
      const heatmap = await getWorkoutsHeatmap(days, workoutType);

      // Validate response schema
      const validatedHeatmap = WorkoutsHeatmapResponseSchema.parse(heatmap);

      // Generate cache tags
      const tags = [
        workoutsTags('heatmap', days, workoutType || 'all'),
        workoutsTags('heatmap'),
      ];

      // Return response with cache headers
      const response = apiSuccess(validatedHeatmap);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.FREQUENT}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching workouts heatmap:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch workouts heatmap',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
