import React from "react";
import { dashboardApi } from "@/lib/api/client";
import type {
  HabitsTodayResponse,
  HabitsConsistencyResponse,
  HabitsStreaksResponse,
  HabitsTrendsResponse,
  GoalsResponse,
  SleepQualityResponse,
} from "@/lib/api/types";
import HabitsClient from "./habits.client";

// Use edge runtime for better performance
export const runtime = "nodejs";

// Force dynamic rendering to fetch data on-demand from API
// API endpoints handle caching with tag-based invalidation
export const dynamic = 'force-dynamic';

// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Habits & Productivity | Dashboard",
  description: "Tracked daily habits and productivity metrics",
};

export default async function HabitsPage() {
  // Fetch habits data from API endpoints in parallel
  const [habitsToday, consistency, streaks, trends, goals, sleepQuality] = await Promise.all([
    dashboardApi.get<HabitsTodayResponse>("/habits/today", {
      tags: ["habits:today"],
      revalidate: 30, // 30 seconds cache (realtime)
    }),
    dashboardApi.get<HabitsConsistencyResponse>("/habits/consistency", {
      params: { days: 7 },
      tags: ["habits:consistency"],
      revalidate: 300, // 5 minutes cache
    }),
    dashboardApi.get<HabitsStreaksResponse>("/habits/streaks", {
      tags: ["habits:streaks"],
      revalidate: 300, // 5 minutes cache
    }),
    dashboardApi.get<HabitsTrendsResponse>("/habits/trends", {
      params: {
        habits: "writing_minutes,focus_minutes",
        days: 14,
      },
      tags: ["habits:trends"],
      revalidate: 300, // 5 minutes cache
    }),
    dashboardApi.get<GoalsResponse>("/goals", {
      tags: ["goals"],
      revalidate: 600, // 10 minutes cache
    }),
    dashboardApi.get<SleepQualityResponse>("/habits/sleep-quality", {
      tags: ["habits:sleep-quality"],
      revalidate: 300, // 5 minutes cache
    }),
  ]);

  // Combine monthly and daily goals for unified access
  const allGoals = {
    ...goals.monthly,
    ...goals.daily,
  };

  // Build progress today array
  const progressToday = [
    {
      name: "Steps",
      value: habitsToday.steps,
      target: allGoals.steps || 0,
    },
    {
      name: "Reading",
      value: habitsToday.reading_minutes,
      target: allGoals.reading_minutes || 0,
    },
    {
      name: "Outdoor",
      value: habitsToday.outdoor_minutes,
      target: allGoals.outdoor_minutes || 0,
    },
    {
      name: "Writing",
      value: habitsToday.writing_minutes,
      target: allGoals.writing_minutes || 0,
    },
    {
      name: "Coding",
      value: habitsToday.coding_minutes,
      target: allGoals.coding_minutes || 0,
    },
  ];

  // Transform consistency data
  const consistencyBars = consistency.habits.map((h) => ({
    name: h.name,
    value: h.consistency_pct,
  }));

  // Transform trends data for Writing vs Focus chart
  const rhythmTrend = trends.trends.map((t) => ({
    date: t.date,
    "Writing (min)": t.values.writing_minutes || 0,
    "Focus (min)": t.values.focus_minutes || 0,
  }));

  // Transform streaks data to match client component format
  const streaksFormatted = {
    reading: streaks.streaks.find((s) => s.habit === "Reading") || { current: 0, longest: 0 },
    outdoor: streaks.streaks.find((s) => s.habit === "Outdoors") || { current: 0, longest: 0 },
    writing: streaks.streaks.find((s) => s.habit === "Writing") || { current: 0, longest: 0 },
    coding: streaks.streaks.find((s) => s.habit === "Coding") || { current: 0, longest: 0 },
    steps: streaks.streaks.find((s) => s.habit === "Steps") || { current: 0, longest: 0 },
  };

  // Sleep quality data from API
  const sleepPrevCaff = sleepQuality.data;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Habits & Productivity
        </h2>
        <p className="text-muted-foreground">
          Tracked daily habits, productivity metrics, streaks, and
          consistency.
        </p>
      </div>

      <HabitsClient
        progressToday={progressToday}
        consistencyBars={consistencyBars}
        rhythmTrend={rhythmTrend}
        streaks={streaksFormatted}
        sleepPrevCaff={sleepPrevCaff}
      />
    </div>
  );
}
