import React from "react";
import { getDashboardData } from "@/lib/db/dashboard";
import WorkoutsClient from "./workouts.client";

// Use edge runtime for better performance
export const runtime = "edge";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Workouts | Dashboard",
  description: "Track your workouts and running activity",
};

export default async function WorkoutsPage() {
  // Fetch dashboard data directly from database
  const dashboardData = await getDashboardData();

  // Calculate workout streak (simplified - could be moved to API)
  const calculateStreak = (heatmap: typeof dashboardData.workoutHeatmap) => {
    let current = 0;
    let longest = 0;
    let streak = 0;

    // Sort by date descending
    const sorted = [...heatmap].sort((a, b) => b.date.localeCompare(a.date));

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].duration_min > 0) {
        streak++;
        if (i === 0) current = streak;
        longest = Math.max(longest, streak);
      } else {
        if (i === 0) current = 0;
        streak = 0;
      }
    }

    return { current, longest };
  };

  // Calculate personal records (simplified)
  const calculatePersonalRecords = () => {
    const runningWorkouts = dashboardData.workoutHeatmap
      .flatMap((day) => day.workouts.filter((w) => w.type === "running"))
      .filter((w) => w.duration_min > 0);

    if (runningWorkouts.length === 0) return undefined;

    // For now, return placeholder - would need actual distance data
    return {
      longestRun: { distance_km: 15.2, date: "2024-11-15" },
      fastestPace: { pace_min_per_km: 4.8, date: "2024-11-20" },
    };
  };

  const streaks = calculateStreak(dashboardData.workoutHeatmap);
  const personalRecords = calculatePersonalRecords();

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
