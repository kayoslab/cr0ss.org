import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';
import { sql } from '@/lib/db/client';
import { revalidateDashboard } from '@/lib/cache/revalidate';
import { ZSubjectiveMetrics } from '@/lib/db/validation';
import { RATE_LIMITS } from '@/lib/rate/config';

const METRIC_COLUMNS = [
  'mood',
  'energy',
  'stress',
  'focus_quality',
  'notes',
] as const;

async function readMetrics(date: string) {
  const rows = await sql /*sql*/ `
    SELECT
      to_char(date, 'YYYY-MM-DD') as date,
      mood,
      energy,
      stress,
      focus_quality,
      notes
    FROM subjective_metrics
    WHERE date = ${date}::date
    LIMIT 1
  `;
  return (
    rows[0] ?? {
      date,
      ...Object.fromEntries(METRIC_COLUMNS.map((c) => [c, null])),
    }
  );
}

/** GET /api/metrics/subjective?date=YYYY-MM-DD — one day's subjective metrics (default: today). */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('get-subjective-metrics', RATE_LIMITS.HABITS)
  .withTrace('GET /api/metrics/subjective')
  .handle(async (request) => {
    let date = new URL(request.url).searchParams.get('date');
    if (!date) {
      const [{ d }] = await sql /*sql*/ `
        SELECT (date_trunc('day', timezone('Europe/Berlin', now()))::date) AS d
      `;
      date = new Date(d as string).toISOString().slice(0, 10);
    }
    return apiSuccess(await readMetrics(date));
  });

/** POST /api/metrics/subjective — upsert a day; only the provided columns are updated. */
export const POST = createApiRoute()
  .withAuth()
  .withRateLimit('post-subjective-metrics', RATE_LIMITS.HABITS)
  .withTrace('POST /api/metrics/subjective')
  .handle(async (request) => {
    const parsed = await validateRequestBody(request, ZSubjectiveMetrics);
    if (!parsed.success) return parsed.response;
    const m = parsed.data;

    // Column names come from the fixed METRIC_COLUMNS list, so interpolating is safe.
    const updates = METRIC_COLUMNS.filter((c) => m[c] !== undefined).map(
      (c) => `${c} = EXCLUDED.${c}`
    );
    const setClause =
      updates.length > 0
        ? updates.join(', ')
        : 'mood = subjective_metrics.mood';

    await sql /*sql*/ `
      INSERT INTO subjective_metrics (
        date, mood, energy, stress, focus_quality, notes
      )
      VALUES (
        ${m.date}::date,
        ${m.mood ?? null}::int,
        ${m.energy ?? null}::int,
        ${m.stress ?? null}::int,
        ${m.focus_quality ?? null}::int,
        ${m.notes ?? null}::text
      )
      ON CONFLICT (date) DO UPDATE SET ${sql.unsafe(setClause)}
    `;

    const updated = await readMetrics(
      m.date instanceof Date
        ? m.date.toISOString().slice(0, 10)
        : String(m.date)
    );
    revalidateDashboard();
    return apiSuccess(updated);
  });
