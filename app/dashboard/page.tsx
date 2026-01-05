import React from "react";
import Link from "next/link";
import { MapPin, Coffee, Activity, BookOpen, Lightbulb } from "lucide-react";
import { dashboardApi } from "@/lib/api/client";
import type {
  CoffeeSummaryResponse,
  HabitsTodayResponse,
  WorkoutsHeatmapResponse,
  GoalsResponse,
  GoalsProgressResponse,
  RunningStatsResponse,
  LocationResponse,
  CountriesResponse,
} from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressRow } from "@/components/dashboard/progress-row";

// Use nodejs runtime for environment variable access
export const runtime = "nodejs";

// Force dynamic rendering to fetch data on-demand from API
// API endpoints handle caching with tag-based invalidation
export const dynamic = 'force-dynamic';

// Use ISR (Incremental Static Regeneration) with 5-minute cache
// Cache is immediately invalidated via revalidatePath() when data changes
export const revalidate = 300; // 5 minutes

export default async function DashboardPage() {
  // Fetch all dashboard data from API endpoints in parallel
  let locationData, countriesData, coffeeSummary, habitsToday, workoutHeatmap, goals, goalsProgress, runningStats;

  try {
    [locationData, countriesData, coffeeSummary, habitsToday, workoutHeatmap, goals, goalsProgress, runningStats] =
      await Promise.all([
        dashboardApi.get<LocationResponse>("/location", {
          tags: ["dashboard:location"],
          revalidate: 300, // 5 minutes
        }),
        dashboardApi.get<CountriesResponse>("/countries", {
          params: { visited: "true" },
          tags: ["dashboard:countries"],
          revalidate: 3600, // 1 hour
        }),
        dashboardApi.get<CoffeeSummaryResponse>("/coffee/summary", {
          tags: ["coffee:summary"],
          revalidate: 60,
        }),
        dashboardApi.get<HabitsTodayResponse>("/habits/today", {
          tags: ["habits:today"],
          revalidate: 30,
        }),
        dashboardApi.get<WorkoutsHeatmapResponse>("/workouts/heatmap", {
          params: { days: 60 },
          tags: ["workouts:heatmap"],
          revalidate: 300,
        }),
        dashboardApi.get<GoalsResponse>("/goals", {
          tags: ["goals"],
          revalidate: 600,
        }),
      dashboardApi.get<GoalsProgressResponse>("/goals/progress", {
        tags: ["goals:progress"],
        revalidate: 60,
      }),
      dashboardApi.get<RunningStatsResponse>("/workouts/running/stats", {
        params: { period: "month" },
        tags: ["workouts:running"],
        revalidate: 60,
      }),
    ]);
  } catch (error) {
    console.error('[Dashboard] Failed to load dashboard data:', error);
    throw error;
  }

  const lat = locationData?.latitude ?? 0;
  const lon = locationData?.longitude ?? 0;
  const hasLocation = locationData != null;

  const countriesSlim = countriesData.countries.map((c) => ({
    id: c.id,
    path: c.path,
    visited: c.visited,
  }));

  const monthlyGoals = goals.monthly;
  const dailyGoals = goals.daily;

  // Calculate today's snapshot KPIs
  const todaySnapshot = {
    coffeeCups: coffeeSummary.cups,
    steps: habitsToday.steps,
    activeMinutes:
      workoutHeatmap.heatmap[workoutHeatmap.heatmap.length - 1]?.duration_min || 0,
    countriesVisited: countriesData.visited_count,
  };

  // Build all goals with their progress from the progress endpoint
  const allGoals: Array<{
    name: string;
    value: number;
    target: number;
    unit: string;
    percentage: number;
    period: "monthly" | "daily";
  }> = [];

  // Process daily goals progress
  if (goalsProgress.daily) {
    for (const goalItem of goalsProgress.daily) {
      allGoals.push({
        name: goalItem.goal,
        value: goalItem.current,
        target: goalItem.target,
        unit: goalItem.unit,
        percentage: goalItem.progress_pct,
        period: "daily",
      });
    }
  }

  // Process monthly goals progress
  if (goalsProgress.monthly) {
    for (const goalItem of goalsProgress.monthly) {
      allGoals.push({
        name: goalItem.goal,
        value: goalItem.current,
        target: goalItem.target,
        unit: goalItem.unit,
        percentage: goalItem.progress_pct,
        period: "monthly",
      });
    }
  }

  // Sort by percentage (highest first) and take top 3 for each period
  const sortedMonthly = allGoals
    .filter((g) => g.period === "monthly")
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const sortedDaily = allGoals
    .filter((g) => g.period === "daily")
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const monthlyGoalsList = sortedMonthly;
  const dailyGoalsList = sortedDaily;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Quantified self metrics and insights at a glance
        </p>
      </div>

      {/* Today's Snapshot - 4 KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Coffee Cups"
          value={todaySnapshot.coffeeCups}
          subtitle="Today"
          icon={Coffee}
        />
        <StatCard
          title="Steps"
          value={todaySnapshot.steps.toLocaleString()}
          subtitle="Today"
          icon={Activity}
        />
        <StatCard
          title="Active Minutes"
          value={todaySnapshot.activeMinutes}
          subtitle="Today"
          icon={Activity}
        />
        <StatCard
          title="Countries"
          value={todaySnapshot.countriesVisited}
          subtitle="Visited"
          icon={MapPin}
        />
      </div>

      {/* Goals Progress - Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Goals Progress */}
        <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Daily Goals</h3>
          {dailyGoalsList.length > 0 ? (
            <div className="space-y-4">
              {dailyGoalsList.map((goal) => (
                <ProgressRow
                  key={goal.name}
                  name={goal.name}
                  value={goal.value}
                  target={goal.target}
                  unit={goal.unit}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No daily goals set</p>
          )}
        </div>

        {/* Monthly Goals Progress */}
        <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Monthly Goals</h3>
          {monthlyGoalsList.length > 0 ? (
            <div className="space-y-4">
              {monthlyGoalsList.map((goal) => (
                <ProgressRow
                  key={goal.name}
                  name={goal.name}
                  value={goal.value}
                  target={goal.target}
                  unit={goal.unit}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No monthly goals set</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/travel"
          className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm hover:bg-neutral-50 transition-colors"
        >
          <MapPin className="w-8 h-8 text-neutral-600" />
          <span className="font-medium">Travel</span>
        </Link>

        <Link
          href="/dashboard/coffee"
          className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm hover:bg-neutral-50 transition-colors"
        >
          <Coffee className="w-8 h-8 text-neutral-600" />
          <span className="font-medium">Coffee</span>
        </Link>

        <Link
          href="/dashboard/workouts"
          className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm hover:bg-neutral-50 transition-colors"
        >
          <Activity className="w-8 h-8 text-neutral-600" />
          <span className="font-medium">Workouts</span>
        </Link>

        <Link
          href="/dashboard/habits"
          className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm hover:bg-neutral-50 transition-colors"
        >
          <BookOpen className="w-8 h-8 text-neutral-600" />
          <span className="font-medium">Habits</span>
        </Link>

        <Link
          href="/dashboard/insights"
          className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm hover:bg-neutral-50 transition-colors"
        >
          <Lightbulb className="w-8 h-8 text-neutral-600" />
          <span className="font-medium">Insights</span>
        </Link>
      </div>
    </div>
  );
}
