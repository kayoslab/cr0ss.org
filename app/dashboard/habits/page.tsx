import React from "react";
import { getHabitsDashboardData, getSharedDashboardData } from "@/lib/db/dashboard";
import HabitsClient from "./habits.client";

// Use edge runtime for better performance
export const runtime = "edge";

// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Habits & Productivity | Dashboard",
  description: "Track your daily habits and productivity metrics",
};

export default async function HabitsPage() {
  // Fetch habits-specific and shared dashboard data
  const [habitsData, sharedData] = await Promise.all([
    getHabitsDashboardData(),
    getSharedDashboardData(),
  ]);

  // Combine monthly and daily goals for unified access
  const allGoals = {
    ...sharedData.monthlyGoals,
    ...sharedData.dailyGoals,
  };

  const progressToday = [
    {
      name: "Steps",
      value: sharedData.habitsToday.steps,
      target: allGoals.steps || 0,
    },
    {
      name: "Reading",
      value: sharedData.habitsToday.reading_minutes,
      target: allGoals.reading_minutes || 0,
    },
    {
      name: "Outdoor",
      value: sharedData.habitsToday.outdoor_minutes,
      target: allGoals.outdoor_minutes || 0,
    },
    {
      name: "Writing",
      value: sharedData.habitsToday.writing_minutes,
      target: allGoals.writing_minutes || 0,
    },
    {
      name: "Coding",
      value: sharedData.habitsToday.coding_minutes,
      target: allGoals.coding_minutes || 0,
    },
  ];

  const consistencyBars = habitsData.habitsConsistency.map((r) => ({
    name: r.name,
    value: Math.round((r.kept / Math.max(1, r.total)) * 100),
  }));

  const rhythmTrend = habitsData.writingVsFocus.map((d) => ({
    date: d.date,
    "Writing (min)": d.writing_minutes,
    "Focus (min)": d.focus_minutes,
  }));

  // Use real streak data from database
  const streaks = habitsData.habitStreaks;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Habits & Productivity
        </h2>
        <p className="text-muted-foreground">
          Track your daily habits, productivity metrics, streaks, and
          consistency.
        </p>
      </div>

      <HabitsClient
        progressToday={progressToday}
        consistencyBars={consistencyBars}
        rhythmTrend={rhythmTrend}
        streaks={streaks}
        sleepPrevCaff={habitsData.sleepPrevCaff}
      />
    </div>
  );
}
