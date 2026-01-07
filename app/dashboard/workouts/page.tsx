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

// Force dynamic rendering to fetch data on-demand from API
// API endpoints handle caching with tag-based invalidation
export const dynamic = 'force-dynamic';

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

  // Extract unique workout types from summary (includes all types ever logged)
  const workoutTypes = summary.workout_types.map((wt) => wt.type);

  // Calculate stats from heatmap data (not summary) to match the visible time period
  // This ensures counts match what's displayed in the heatmap
  const workoutStats = workoutTypes.map((type) => {
    const typeWorkouts = heatmap.heatmap.flatMap((day) =>
      day.workouts.filter((w) => w.type === type)
    );

    return {
      workout_type: type,
      count: typeWorkouts.length,
      total_duration_min: typeWorkouts.reduce((sum, w) => sum + w.duration_min, 0),
      total_distance_km: 0,
    };
  });

  // Transform heatmap to match client component format
  const workoutHeatmap = heatmap.heatmap.map((day) => ({
    date: day.date,
    duration_min: day.duration_min,
    workouts: day.workouts,
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
