import { z } from 'zod';
import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';
import { sql } from '@/lib/db/client';
import { ZRun } from '@/lib/db/validation';
import { revalidateWorkouts } from '@/lib/cache/revalidate';
import { RATE_LIMITS } from '@/lib/rate/config';

/** GET /api/habits/run — the 50 most recent runs. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('get-run', RATE_LIMITS.HABITS)
  .withTrace('GET /api/habits/run')
  .handle(async () => {
    const rows = await sql /*sql*/ `
      SELECT
        id,
        date::text,
        distance_km::float,
        duration_min::float,
        avg_pace_sec_per_km::int
      FROM runs
      ORDER BY date DESC
      LIMIT 50
    `;
    return apiSuccess(rows);
  });

const ZRunBatch = z.union([ZRun, z.array(ZRun)]);

/** POST /api/habits/run — log one run or an array of them. */
export const POST = createApiRoute()
  .withAuth()
  .withRateLimit('post-run', RATE_LIMITS.HABITS)
  .withTrace('POST /api/habits/run')
  .handle(async (request) => {
    const parsed = await validateRequestBody(request, ZRunBatch);
    if (!parsed.success) return parsed.response;
    const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

    for (const i of items) {
      await sql /*sql*/ `
        insert into runs (date, distance_km, duration_min, avg_pace_sec_per_km)
        values (${i.date}, ${i.distance_km}, ${i.duration_min}, ${i.avg_pace_sec_per_km ?? null});
      `;
    }

    revalidateWorkouts();
    return apiSuccess({ ok: true, inserted: items.length });
  });
