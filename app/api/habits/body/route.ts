import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';
import { ZBodyProfileUpsert } from '@/lib/db/validation';
import { getBodyProfileDB, upsertBodyProfileDB } from '@/lib/db/profile';
import { revalidateShared } from '@/lib/cache/revalidate';
import { RATE_LIMITS } from '@/lib/rate/config';

/** GET /api/habits/body — current body profile. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('get-body', RATE_LIMITS.HABITS)
  .withTrace('GET /api/habits/body')
  .handle(async () => apiSuccess(await getBodyProfileDB()));

/** POST /api/habits/body — partial or full body-profile update. */
export const POST = createApiRoute()
  .withAuth()
  .withRateLimit('post-body', RATE_LIMITS.HABITS)
  .withTrace('POST /api/habits/body')
  .handle(async (request) => {
    const parsed = await validateRequestBody(request, ZBodyProfileUpsert);
    if (!parsed.success) return parsed.response;

    const profile = await upsertBodyProfileDB(parsed.data);
    revalidateShared();
    return apiSuccess({ ok: true, profile });
  });
