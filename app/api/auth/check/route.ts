import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';

/** GET /api/auth/check — 200 when the request carries a valid secret. */
export const GET = createApiRoute()
  .withAuth()
  .handle(async () => apiSuccess({ ok: true }));
