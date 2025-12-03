/**
 * Dashboard overview data
 *
 * Aggregates data from other dashboard modules for the overview page
 */

import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_KEYS } from "@/lib/constants/cache";
import { getSharedDashboardData } from "./shared";
import { getCoffeeDashboardData } from "./coffee";
import { getWorkoutsDashboardData } from "./workouts";

/**
 * Get overview dashboard data
 * Combines shared, coffee, and workouts data for the overview page
 * Cached separately with DASHBOARD tag
 */
export const getOverviewDashboardData = unstable_cache(
  async () => {
    const [shared, coffee, workouts] = await Promise.all([
      getSharedDashboardData(),
      getCoffeeDashboardData(),
      getWorkoutsDashboardData(),
    ]);

    return {
      ...shared,
      cupsToday: coffee.cupsToday,
      workoutHeatmap: workouts.workoutHeatmap,
      runningProgress: workouts.runningProgress,
    };
  },
  [CACHE_KEYS.DASHBOARD_DATA],
  {
    tags: [CACHE_TAGS.DASHBOARD],
    revalidate: 300, // 5 minutes
  }
);

export type OverviewDashboardData = Awaited<ReturnType<typeof getOverviewDashboardData>>;
