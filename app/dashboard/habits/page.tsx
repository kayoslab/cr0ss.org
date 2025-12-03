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

  const goals = sharedData.monthlyGoals;

  const progressToday = [
    {
      name: "Steps",
      value: sharedData.habitsToday.steps,
      target: goals.steps,
    },
    {
      name: "Reading",
      value: sharedData.habitsToday.reading_minutes,
      target: goals.reading_minutes,
    },
    {
      name: "Outdoor",
      value: sharedData.habitsToday.outdoor_minutes,
      target: goals.outdoor_minutes,
    },
    {
      name: "Writing",
      value: sharedData.habitsToday.writing_minutes,
      target: goals.writing_minutes,
    },
    {
      name: "Coding",
      value: sharedData.habitsToday.coding_minutes,
      target: goals.coding_minutes,
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
