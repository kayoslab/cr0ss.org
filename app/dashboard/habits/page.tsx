import React from "react";
import { getDashboardData } from "@/lib/db/dashboard";
import HabitsClient from "./habits.client";

// Use edge runtime for better performance
export const runtime = "edge";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Habits & Productivity | Dashboard",
  description: "Track your daily habits and productivity metrics",
};

export default async function HabitsPage() {
  // Fetch dashboard data directly from database
  const dashboardData = await getDashboardData();

  const goals = dashboardData.monthlyGoals ?? {
    running_distance_km: 0,
    steps: 0,
    reading_minutes: 0,
    outdoor_minutes: 0,
    writing_minutes: 0,
    coding_minutes: 0,
    focus_minutes: 0,
  };

  const progressToday = [
    {
      name: "Steps",
      value: dashboardData.habitsToday.steps,
      target: goals.steps,
    },
    {
      name: "Reading",
      value: dashboardData.habitsToday.reading_minutes,
      target: goals.reading_minutes,
    },
    {
      name: "Outdoor",
      value: dashboardData.habitsToday.outdoor_minutes,
      target: goals.outdoor_minutes,
    },
    {
      name: "Writing",
      value: dashboardData.habitsToday.writing_minutes,
      target: goals.writing_minutes,
    },
    {
      name: "Coding",
      value: dashboardData.habitsToday.coding_minutes,
      target: goals.coding_minutes,
    },
  ];

  const consistencyBars = dashboardData.habitsConsistency.map((r) => ({
    name: r.name,
    value: Math.round((r.kept / Math.max(1, r.total)) * 100),
  }));

  const rhythmTrend = dashboardData.writingVsFocus.map((d) => ({
    date: d.date,
    "Writing (min)": d.writing_minutes,
    "Focus (min)": d.focus_minutes,
  }));

  // Calculate habit streaks (simplified - mock data for now)
  const streaks = {
    reading: { current: 5, longest: 12 },
    outdoor: { current: 3, longest: 8 },
    writing: { current: 7, longest: 15 },
    coding: { current: 0, longest: 10 },
    steps: { current: 14, longest: 21 },
  };

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
        sleepPrevCaff={dashboardData.sleepPrevCaff}
      />
    </div>
  );
}
