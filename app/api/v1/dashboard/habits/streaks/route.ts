export const runtime = 'edge';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { habitsTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { sql } from '@/lib/db/client';
import { z } from 'zod';

/**
 * Response schema for habits streaks endpoint
 */
const HabitsStreaksResponseSchema = z.object({
  streaks: z.array(
    z.object({
      habit: z.string(),
      current: z.number().int().min(0),
      longest: z.number().int().min(0),
      target: z.number(),
    })
  ),
});

export type HabitsStreaksResponse = z.infer<typeof HabitsStreaksResponseSchema>;

/**
 * Calculate streak for a boolean array (most recent first)
 * A streak is broken if a day doesn't meet the target
 */
function calculateStreak(data: boolean[]): { current: number; longest: number } {
  let current = 0;
  let longest = 0;
  let streak = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i]) {
      streak++;
      if (i === 0) current = streak; // First day is today
      longest = Math.max(longest, streak);
    } else {
      if (i === 0) current = 0; // Broke streak today
      streak = 0;
    }
  }

  return { current, longest };
}

/**
 * Get habit streaks data
 *
 * @returns Streak data for all habits
 */
async function getHabitsStreaks(): Promise<HabitsStreaksResponse> {
  // Get goals from the goals table (daily targets)
  const [{ month_start }] = await sql/*sql*/`
    SELECT (date_trunc('month', timezone('Europe/Berlin', now()))::date) AS month_start
  `;

  const goalsRows = await sql/*sql*/`
    SELECT kind::text, target::numeric
    FROM monthly_goals
    WHERE month = ${month_start}::date
      AND period = 'daily'
  `;

  interface GoalRow {
    kind: string;
    target: number;
  }

  // Build map of habit targets
  const targets = new Map<string, number>();
  for (const r of goalsRows) {
    const row = r as GoalRow;
    targets.set(String(row.kind), Number(row.target));
  }

  // If no goals are set, use default thresholds
  if (targets.size === 0) {
    targets.set('steps', 8000);
    targets.set('reading_minutes', 30);
    targets.set('outdoor_minutes', 30);
    targets.set('writing_minutes', 30);
    targets.set('coding_minutes', 30);
  }

  // Get the last 365 days of habit data
  const rows = await sql/*sql*/`
    SELECT
      date,
      steps,
      reading_minutes,
      outdoor_minutes,
      writing_minutes,
      coding_minutes
    FROM days
    WHERE date >= current_date - interval '365 days'
    ORDER BY date DESC
  `;

  interface HabitRow {
    date: Date;
    steps: number | null;
    reading_minutes: number | null;
    outdoor_minutes: number | null;
    writing_minutes: number | null;
    coding_minutes: number | null;
  }

  const habitData = rows.map((r) => r as HabitRow);

  const habitMap = {
    steps: 'Steps',
    reading_minutes: 'Reading',
    outdoor_minutes: 'Outdoors',
    writing_minutes: 'Writing',
    coding_minutes: 'Coding',
  };

  const streaks: Array<{
    habit: string;
    current: number;
    longest: number;
    target: number;
  }> = [];

  for (const [key, label] of Object.entries(habitMap)) {
    const target = targets.get(key) || 0;
    const meetsTarget = habitData.map((d) => {
      const value = d[key as keyof Omit<HabitRow, 'date'>];
      return (value || 0) >= target;
    });

    const { current, longest } = calculateStreak(meetsTarget);

    streaks.push({
      habit: label,
      current,
      longest,
      target,
    });
  }

  return { streaks };
}

/**
 * GET /api/v1/dashboard/habits/streaks
 *
 * Returns current and longest streaks for all habits.
 * A streak is broken if a day doesn't meet the target value.
 *
 * Response:
 * - streaks: Array of streak data
 *   - habit: Habit name
 *   - current: Current streak in days
 *   - longest: All-time longest streak in days
 *   - target: Daily target to maintain streak
 *
 * Cache:
 * - Duration: 5 minutes (FREQUENT)
 * - Tags: habits:streaks
 *
 * Example:
 * GET /api/v1/dashboard/habits/streaks
 * {
 *   "streaks": [
 *     {
 *       "habit": "Steps",
 *       "current": 12,
 *       "longest": 45,
 *       "target": 8000
 *     },
 *     {
 *       "habit": "Reading",
 *       "current": 3,
 *       "longest": 30,
 *       "target": 30
 *     }
 *   ]
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-habits-streaks', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/habits/streaks')
  .handle(async (request) => {
    try {
      // Fetch streaks data
      const streaksData = await getHabitsStreaks();

      // Validate response schema
      const validatedStreaks = HabitsStreaksResponseSchema.parse(streaksData);

      // Generate cache tags
      const tags = [habitsTags('streaks')];

      // Return response with cache headers
      const response = apiSuccess(validatedStreaks);

      // Add cache tags via Next.js headers
      response.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (5 minutes - FREQUENT)
      response.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.FREQUENT}, stale-while-revalidate`
      );

      return response;
    } catch (error) {
      console.error('Error fetching habits streaks:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch habits streaks',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
