import React from "react";
import { getWorkoutsDashboardData } from "@/lib/db/dashboard";
import WorkoutsClient from "./workouts.client";

// Use edge runtime for better performance
export const runtime = "edge";

// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Workouts | Dashboard",
  description: "Track your workouts and running activity",
};

export default async function WorkoutsPage() {
  // Fetch workouts-specific dashboard data
  const workoutsData = await getWorkoutsDashboardData();

  // Use real streak and personal records data from database
  const streaks = workoutsData.workoutStreaks;

  // Transform personal records to match expected type
  const personalRecords = workoutsData.runningPersonalRecords
    ? {
        longestRun: workoutsData.runningPersonalRecords.longestRun,
        fastestPace: workoutsData.runningPersonalRecords.fastestPace || undefined,
      }
    : undefined;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workouts</h2>
        <p className="text-muted-foreground">
          Track your workout sessions, training progress, and personal records.
        </p>
      </div>

      <WorkoutsClient
        workoutTypes={workoutsData.workoutTypes}
        workoutStats={workoutsData.workoutStats}
        workoutHeatmap={workoutsData.workoutHeatmap}
        currentStreak={streaks.current}
        longestStreak={streaks.longest}
        personalRecords={personalRecords}
      />
    </div>
  );
}
