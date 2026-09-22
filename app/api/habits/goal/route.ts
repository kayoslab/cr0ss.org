import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';
import { sql } from '@/lib/db/client';
import { revalidateGoals } from '@/lib/cache/revalidate';
import { ZMonthlyGoalsUpsert } from '@/lib/db/validation';
import { RATE_LIMITS } from '@/lib/rate/config';

const GOAL_KINDS = [
  'running_distance_km',
  'steps',
  'reading_minutes',
  'outdoor_minutes',
  'writing_minutes',
  'coding_minutes',
  'focus_minutes',
] as const;

/** GET /api/habits/goal — this month's goals, keyed by kind, zero when unset. */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('get-goal', RATE_LIMITS.HABITS)
  .withTrace('GET /api/habits/goal')
  .handle(async () => {
    const [{ month_start }] = await sql /*sql*/ `
      SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
    `;
    const rows = await sql /*sql*/ `
      SELECT kind::text, target::numeric, period::text
      FROM monthly_goals
      WHERE month = ${month_start}::date
    `;

    const out: Record<string, { target: number; period: string }> =
      Object.fromEntries(
        GOAL_KINDS.map((k) => [
          k,
          {
            target: 0,
            period: k === 'running_distance_km' ? 'monthly' : 'daily',
          },
        ])
      );
    for (const r of rows as Array<{
      kind: string;
      target: number;
      period: string;
    }>) {
      if (r.kind in out)
        out[r.kind] = { target: Number(r.target), period: String(r.period) };
    }
    return apiSuccess(out);
  });

/** POST /api/habits/goal — upsert this month's goals (partial or full). */
export const POST = createApiRoute()
  .withAuth()
  .withRateLimit('post-goal', RATE_LIMITS.HABITS)
  .withTrace('POST /api/habits/goal')
  .handle(async (request) => {
    const parsed = await validateRequestBody(request, ZMonthlyGoalsUpsert);
    if (!parsed.success) return parsed.response;

    const [{ month_start }] = await sql /*sql*/ `
      SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
    `;

    for (const k of GOAL_KINDS) {
      const goal = parsed.data?.[k];
      if (goal === undefined) continue;
      // Accept both `{ target, period }` and the older bare-number form.
      const target =
        typeof goal === 'object' && goal !== null && 'target' in goal
          ? Number(goal.target)
          : Number(goal);
      const period =
        typeof goal === 'object' && goal !== null && 'period' in goal
          ? String(goal.period)
          : k === 'running_distance_km'
            ? 'monthly'
            : 'daily';

      await sql /*sql*/ `
        INSERT INTO monthly_goals (month, kind, target, period)
        VALUES (${month_start}::date, ${k}::goal_kind, ${target}::numeric, ${period}::goal_period)
        ON CONFLICT (month, kind) DO UPDATE SET target = EXCLUDED.target, period = EXCLUDED.period
      `;
    }

    revalidateGoals();
    return apiSuccess({ ok: true });
  });
