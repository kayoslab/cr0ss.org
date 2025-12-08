import React from "react";
import { dashboardApi } from "@/lib/api/client";
import type {
  WorkoutsSummaryResponse,
  WorkoutsHeatmapResponse,
  RunningStatsResponse,
} from "@/lib/api/types";
import WorkoutsClient from "./workouts.client";

// Use edge runtime for better performance
export const runtime = "nodejs";


// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Workouts | Dashboard",
  description: "Tracked workouts and running activity",
};

export default async function WorkoutsPage() {
  // Fetch workouts data from API endpoints in parallel
  const [summary, heatmap, runningStats] = await Promise.all([
    dashboardApi.get<WorkoutsSummaryResponse>("/workouts/summary", {
      params: { period: "month" },
      tags: ["workouts:summary"],
      revalidate: 60, // 1 minute cache
    }),
    dashboardApi.get<WorkoutsHeatmapResponse>("/workouts/heatmap", {
      params: { days: 60 },
      tags: ["workouts:heatmap"],
      revalidate: 300, // 5 minutes cache
    }),
    dashboardApi.get<RunningStatsResponse>("/workouts/running/stats", {
      params: { period: "month" },
      tags: ["workouts:running"],
      revalidate: 60, // 1 minute cache
    }),
  ]);

  // Extract unique workout types from summary
  const workoutTypes = summary.workout_types.map((wt) => wt.type);

  // Transform workout stats to match client component format
  const workoutStats = summary.workout_types.map((wt) => ({
    workout_type: wt.type,
    count: wt.count,
    total_duration_min: wt.total_duration_min,
    total_distance_km: 0, // We'll calculate this from heatmap if needed
  }));

  // Transform heatmap to match client component format
  // The client expects workouts array per day, but API returns aggregated data
  // We'll create a simplified version that works with the client
  const workoutHeatmap = heatmap.heatmap.map((day) => ({
    date: day.date,
    duration_min: day.duration_min,
    workouts: day.duration_min > 0
      ? [{ type: "workout", duration_min: day.duration_min }] // Simplified for now
      : [],
  }));

  // Transform personal records to match client component format
  const personalRecords = {
    longestRun: {
      distance_km: runningStats.personal_records.longest_run_km,
      date: runningStats.personal_records.longest_run_date,
    },
    fastestPace: {
      pace_min_per_km: runningStats.personal_records.fastest_pace_sec_per_km / 60,
      date: runningStats.personal_records.fastest_pace_date,
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workouts</h2>
        <p className="text-muted-foreground">
          Tracked workout sessions, training progress, and personal records.
        </p>
      </div>

      <WorkoutsClient
        workoutTypes={workoutTypes}
        workoutStats={workoutStats}
        workoutHeatmap={workoutHeatmap}
        currentStreak={summary.streaks.current}
        longestStreak={summary.streaks.longest}
        personalRecords={personalRecords}
      />
    </div>
  );
}
