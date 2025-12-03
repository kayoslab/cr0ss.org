import React from "react";
import { getDashboardData } from "@/lib/db/dashboard";
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
  // Fetch dashboard data directly from database
  const dashboardData = await getDashboardData();

  // Use real streak and personal records data from database
  const streaks = dashboardData.workoutStreaks;

  // Transform personal records to match expected type
  const personalRecords = dashboardData.runningPersonalRecords
    ? {
        longestRun: dashboardData.runningPersonalRecords.longestRun,
        fastestPace: dashboardData.runningPersonalRecords.fastestPace || undefined,
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
        workoutTypes={dashboardData.workoutTypes}
        workoutStats={dashboardData.workoutStats}
        workoutHeatmap={dashboardData.workoutHeatmap}
        currentStreak={streaks.current}
        longestStreak={streaks.longest}
        personalRecords={personalRecords}
      />
    </div>
  );
}
