/**
 * Shared dashboard data
 *
 * Data that is used by multiple dashboard pages, cached separately
 * for efficient revalidation.
 */

import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_KEYS } from "@/lib/constants/cache";
import { qMonthlyGoalsObject, qHabitsToday } from "@/lib/db/queries";

/**
 * Get shared dashboard data used by multiple pages
 * Cached separately with DASHBOARD_SHARED tag
 */
export const getSharedDashboardData = unstable_cache(
  async () => {
    const [monthlyGoals, habitsToday] = await Promise.all([
      qMonthlyGoalsObject(),
      qHabitsToday(),
    ]);

    return {
      monthlyGoals: {
        running_distance_km: 0,
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
        ...monthlyGoals,
      },
      habitsToday,
    };
  },
  [CACHE_KEYS.DASHBOARD_SHARED],
  {
    tags: [CACHE_TAGS.DASHBOARD_SHARED],
    revalidate: 300, // 5 minutes
  }
);

export type SharedDashboardData = Awaited<ReturnType<typeof getSharedDashboardData>>;
