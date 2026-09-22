/**
 * Goals dashboard data: the current month's targets and progress against them.
 */
import { z } from 'zod';
import { sql } from '@/lib/db/client';
import { cached } from '@/lib/cache/cached';
import { tags, CACHE_LIFE } from '@/lib/cache/tags';

export const GoalsSchema = z.object({
  daily: z.record(z.string(), z.number()),
  monthly: z.record(z.string(), z.number()),
});
export type Goals = z.infer<typeof GoalsSchema>;

export const GoalProgressItemSchema = z.object({
  goal: z.string(),
  target: z.number(),
  current: z.number(),
  progress_pct: z.number().min(0).max(100),
  unit: z.string(),
});
export type GoalProgressItem = z.infer<typeof GoalProgressItemSchema>;

export const GoalsProgressSchema = z.object({
  daily: z.array(GoalProgressItemSchema).optional(),
  monthly: z.array(GoalProgressItemSchema).optional(),
});
export type GoalsProgress = z.infer<typeof GoalsProgressSchema>;
export type GoalPeriod = 'daily' | 'monthly';

/** Goal columns that may be summed from the `days` table. */
const DAY_GOAL_COLUMNS = new Set([
  'steps',
  'reading_minutes',
  'outdoor_minutes',
  'writing_minutes',
  'coding_minutes',
  'focus_minutes',
]);

const label = (kind: string) =>
  kind
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

async function queryGoals(): Promise<Goals> {
  const [{ month_start }] = await sql /*sql*/ `
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;
  const rows = await sql /*sql*/ `
    SELECT kind::text, target::numeric, period::text
    FROM monthly_goals
    WHERE month = ${month_start}::date
  `;
  const daily: Record<string, number> = {};
  const monthly: Record<string, number> = {};
  for (const r of rows) {
    const kind = String(r.kind);
    const target = Number(r.target);
    if (r.period === 'daily') daily[kind] = target;
    else if (r.period === 'monthly') monthly[kind] = target;
  }
  return GoalsSchema.parse({ daily, monthly });
}

async function queryGoalsProgress(period?: GoalPeriod): Promise<GoalsProgress> {
  const [{ month_start }] = await sql /*sql*/ `
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;
  const [{ today }] = await sql /*sql*/ `
    SELECT timezone('Europe/Berlin', now())::date::text AS today
  `;
  const result: GoalsProgress = {};

  if (!period || period === 'daily') {
    const goals = await sql /*sql*/ `
      SELECT kind::text, target::numeric
      FROM monthly_goals
      WHERE month = ${month_start}::date
        AND period = 'daily'
    `;
    const daily: GoalProgressItem[] = [];
    for (const r of goals) {
      const kind = String(r.kind);
      const target = Number(r.target);
      if (!DAY_GOAL_COLUMNS.has(kind)) continue;
      const rows = await sql /*sql*/ `
        SELECT COALESCE(${sql.unsafe(kind)}, 0)::numeric as current
        FROM days
        WHERE date = ${today}::date
        LIMIT 1
      `;
      const current = rows.length > 0 ? Number(rows[0].current) : 0;
      daily.push({
        goal: label(kind),
        target,
        current,
        progress_pct:
          target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
        unit: kind === 'steps' ? 'steps' : 'minutes',
      });
    }
    if (daily.length > 0) result.daily = daily;
  }

  if (!period || period === 'monthly') {
    const goals = await sql /*sql*/ `
      SELECT kind::text, target::numeric
      FROM monthly_goals
      WHERE month = ${month_start}::date
        AND period = 'monthly'
    `;
    const monthly: GoalProgressItem[] = [];
    for (const r of goals) {
      const kind = String(r.kind);
      const target = Number(r.target);
      let current = 0;
      let unit = '';
      if (kind === 'running_distance_km') {
        const rows = await sql /*sql*/ `
          SELECT COALESCE(SUM((details->>'distance_km')::numeric), 0)::numeric as total
          FROM workouts
          WHERE workout_type = 'running'
            AND date >= ${month_start}::date
            AND date < (${month_start}::date + interval '1 month')
            AND details ? 'distance_km'
        `;
        current = rows.length > 0 ? Number(rows[0].total) : 0;
        unit = 'km';
      } else if (DAY_GOAL_COLUMNS.has(kind)) {
        const rows = await sql /*sql*/ `
          SELECT COALESCE(SUM(${sql.unsafe(kind)}), 0)::numeric as total
          FROM days
          WHERE date >= ${month_start}::date
            AND date < (${month_start}::date + interval '1 month')
        `;
        current = rows.length > 0 ? Number(rows[0].total) : 0;
        unit = kind === 'steps' ? 'steps' : 'minutes';
      } else {
        continue;
      }
      monthly.push({
        goal: label(kind),
        target,
        current,
        progress_pct:
          target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
        unit,
      });
    }
    if (monthly.length > 0) result.monthly = monthly;
  }

  return GoalsProgressSchema.parse(result);
}

export const getGoals = cached('goals', queryGoals, {
  tags: () => [tags.goals.list],
  revalidate: CACHE_LIFE.frequent,
});

export const getGoalsProgress = cached('goals-progress', queryGoalsProgress, {
  tags: (period) => [tags.goals.progress(period), tags.goals.progress()],
  revalidate: CACHE_LIFE.realtime,
});
