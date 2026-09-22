import { z } from 'zod';
import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';
import { ZWorkoutUpsert } from '@/lib/db/validation';
import { revalidateWorkouts } from '@/lib/cache/revalidate';
import {
  insertWorkoutDB,
  getRecentWorkoutsDB,
  getWorkoutsByTypeDB,
} from '@/lib/db/workouts';
import { RATE_LIMITS } from '@/lib/rate/config';

/** GET /api/habits/workout?type&limit — recent workouts, optionally by type. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('get-workout', RATE_LIMITS.HABITS)
  .withTrace('GET /api/habits/workout')
  .handle(async (request) => {
    const q = new URL(request.url).searchParams;
    const workoutType = q.get('type');
    const limit = parseInt(q.get('limit') || '50', 10);
    const workouts = workoutType
      ? await getWorkoutsByTypeDB(workoutType, limit)
      : await getRecentWorkoutsDB(limit);
    return apiSuccess(workouts);
  });

const ZWorkoutBatch = z.union([ZWorkoutUpsert, z.array(ZWorkoutUpsert)]);

/** POST /api/habits/workout — log one workout or an array of them. */
export const POST = createApiRoute()
  .withAuth()
  .withRateLimit('post-workout', RATE_LIMITS.HABITS)
  .withTrace('POST /api/habits/workout')
  .handle(async (request) => {
    const parsed = await validateRequestBody(request, ZWorkoutBatch);
    if (!parsed.success) return parsed.response;
    const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

    const inserted = [];
    for (const workout of items) inserted.push(await insertWorkoutDB(workout));

    revalidateWorkouts();
    return apiSuccess({
      ok: true,
      inserted: inserted.length,
      workouts: inserted,
    });
  });
