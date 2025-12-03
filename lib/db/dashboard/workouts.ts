/**
 * Workouts dashboard data
 *
 * Workout tracking, running stats, and heatmaps
 */

import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_KEYS } from "@/lib/constants/cache";
import {
  qRunningMonthlyProgress,
  qRunningPersonalRecords,
  qPaceLastRuns,
  qRunningHeatmap,
  qWorkoutHeatmap,
  qWorkoutStreaks,
  qWorkoutTypesPresent,
  qWorkoutStatsByType,
} from "@/lib/db/queries";

/**
 * Get workouts-specific dashboard data
 * Cached separately with WORKOUTS tag
 */
export const getWorkoutsDashboardData = unstable_cache(
  async () => {
    const [
      runningProgress,
      runningRecords,
      paceSeries,
      runningHeatmap,
      workoutHeatmap,
      workoutStreaks,
      workoutTypes,
    ] = await Promise.all([
      qRunningMonthlyProgress(),
      qRunningPersonalRecords(),
      qPaceLastRuns(10),
      qRunningHeatmap(42),
      qWorkoutHeatmap(60),
      qWorkoutStreaks(),
      qWorkoutTypesPresent(60),
    ]);

    // Get stats for each workout type present
    const workoutStats = await Promise.all(
      workoutTypes.map((type) => qWorkoutStatsByType(type, 60))
    );

    return {
      runningProgress,
      runningPersonalRecords: runningRecords,
      paceSeries,
      runningHeatmap,
      workoutHeatmap,
      workoutStreaks,
      workoutTypes,
      workoutStats,
    };
  },
  [CACHE_KEYS.WORKOUTS_DATA],
  {
    tags: [CACHE_TAGS.WORKOUTS],
    revalidate: 300, // 5 minutes
  }
);

export type WorkoutsDashboardData = Awaited<ReturnType<typeof getWorkoutsDashboardData>>;
