import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/responses';
import { sql } from '@/lib/db/client';
import { revalidateHabits } from '@/lib/cache/revalidate';
import { ZDayUpsert } from '@/lib/db/validation';
import { RATE_LIMITS } from '@/lib/rate/config';

const DAY_COLUMNS = [
  'sleep_score',
  'focus_minutes',
  'steps',
  'reading_minutes',
  'outdoor_minutes',
  'writing_minutes',
  'coding_minutes',
] as const;

async function readDay(date: string) {
  const rows = await sql /*sql*/ `
    SELECT
      to_char(date, 'YYYY-MM-DD') as date,
      COALESCE(sleep_score,0)::int           as sleep_score,
      COALESCE(focus_minutes,0)::int         as focus_minutes,
      COALESCE(steps,0)::int                 as steps,
      COALESCE(reading_minutes,0)::int       as reading_minutes,
      COALESCE(outdoor_minutes,0)::int       as outdoor_minutes,
      COALESCE(writing_minutes,0)::int       as writing_minutes,
      COALESCE(coding_minutes,0)::int        as coding_minutes
    FROM days
    WHERE date = ${date}::date
    LIMIT 1
  `;
  return (
    rows[0] ?? { date, ...Object.fromEntries(DAY_COLUMNS.map((c) => [c, 0])) }
  );
}

/** GET /api/habits/day?date=YYYY-MM-DD — one day's habit numbers (default: today). */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('get-day', RATE_LIMITS.HABITS)
  .withTrace('GET /api/habits/day')
  .handle(async (request) => {
    let date = new URL(request.url).searchParams.get('date');
    if (!date) {
      const [{ d }] = await sql /*sql*/ `
        SELECT (date_trunc('day', timezone('Europe/Berlin', now()))::date) AS d
      `;
      date = new Date(d as string).toISOString().slice(0, 10);
    }
    return apiSuccess(await readDay(date));
  });

/** POST /api/habits/day — upsert a day; only the provided columns are updated. */
export const POST = createApiRoute()
  .withAuth()
  .withRateLimit('post-day', RATE_LIMITS.HABITS)
  .withTrace('POST /api/habits/day')
  .handle(async (request) => {
    const parsed = await validateRequestBody(request, ZDayUpsert);
    if (!parsed.success) return parsed.response;
    const day = parsed.data;

    // Column names come from the fixed DAY_COLUMNS list, so interpolating is safe.
    const updates = DAY_COLUMNS.filter((c) => day[c] !== undefined).map(
      (c) => `${c} = EXCLUDED.${c}`
    );
    const setClause =
      updates.length > 0
        ? updates.join(', ')
        : 'sleep_score = days.sleep_score';

    await sql /*sql*/ `
      INSERT INTO days (
        date, sleep_score, focus_minutes, steps,
        reading_minutes, outdoor_minutes, writing_minutes,
        coding_minutes
      )
      VALUES (
        ${day.date}::date,
        ${day.sleep_score ?? 0}::int,
        ${day.focus_minutes ?? 0}::int,
        ${day.steps ?? 0}::int,
        ${day.reading_minutes ?? 0}::int,
        ${day.outdoor_minutes ?? 0}::int,
        ${day.writing_minutes ?? 0}::int,
        ${day.coding_minutes ?? 0}::int
      )
      ON CONFLICT (date) DO UPDATE SET ${sql.unsafe(setClause)}
    `;

    const updated = await readDay(day.date);
    revalidateHabits();
    return apiSuccess(updated);
  });
