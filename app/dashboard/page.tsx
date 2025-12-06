import React from "react";
import Link from "next/link";
import { MapPin, Coffee, Activity, BookOpen, Lightbulb } from "lucide-react";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import { getCurrentLocation } from "@/lib/db/location";
import { dashboardApi } from "@/lib/api/client";
import type {
  CoffeeSummaryResponse,
  HabitsTodayResponse,
  WorkoutsHeatmapResponse,
  GoalsResponse,
  GoalsProgressResponse,
  RunningStatsResponse,
} from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Use nodejs runtime for environment variable access
export const runtime = "nodejs";

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export default async function DashboardPage() {
  // Get current location from database view
  const currentLocation = await getCurrentLocation();
  const lat = currentLocation?.latitude ?? 0;
  const lon = currentLocation?.longitude ?? 0;
  const hasLocation = currentLocation != null;

  // Fetch overview dashboard data from API endpoints in parallel
  let coffeeSummary, habitsToday, workoutHeatmap, goals, goalsProgress, runningStats;

  try {
    [coffeeSummary, habitsToday, workoutHeatmap, goals, goalsProgress, runningStats] =
      await Promise.all([
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
    // Enhanced error logging for debugging on Vercel
    console.error('[Dashboard] API call failed:', {
      error,
      errorType: error?.constructor?.name,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      runtime: process.env.NEXT_RUNTIME || 'nodejs',
      hasSecret: !!process.env.DASHBOARD_API_SECRET,
    });

    // Re-throw with enhanced message for visibility in browser
    if (error instanceof Error) {
      const enhancedError = new Error(
        `Dashboard API Error: ${error.message}\n` +
        `Runtime: ${process.env.NEXT_RUNTIME || 'nodejs'}\n` +
        `Has Secret: ${!!process.env.DASHBOARD_API_SECRET}\n` +
        `Original: ${error.stack}`
      );
      enhancedError.name = 'DashboardLoadError';
      throw enhancedError;
    }
    throw error;
  }

  // Contentful data
  const [countries = [], visited = []] = await Promise.all([
    getAllCountries(),
    getVisitedCountries(true),
  ]);
  const countriesSlim = (countries as unknown as CountryProps[]).map(
    (c: CountryProps) => ({
      id: c.id,
      path: c.data?.path ?? "",
      visited: c.lastVisited != null,
    })
  );

  const monthlyGoals = goals.monthly;
  const dailyGoals = goals.daily;

  // Calculate today's snapshot KPIs
  const todaySnapshot = {
    coffeeCups: coffeeSummary.cups,
    steps: habitsToday.steps,
    activeMinutes:
      workoutHeatmap.heatmap[workoutHeatmap.heatmap.length - 1]?.duration_min || 0,
    countriesVisited: visited.length,
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coffee Cups</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{todaySnapshot.coffeeCups}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Steps</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{todaySnapshot.steps.toLocaleString()}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{todaySnapshot.activeMinutes}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Countries</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{todaySnapshot.countriesVisited}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Visited</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress - Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Goals Progress */}
        <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Daily Goals</h3>
          {dailyGoalsList.length > 0 ? (
            <div className="space-y-4">
              {dailyGoalsList.map((goal) => (
                <div key={goal.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-neutral-500">
                      {goal.value.toLocaleString()} /{" "}
                      {goal.target.toLocaleString()} {goal.unit}
                    </span>
                  </div>
                  <Progress value={Math.min(goal.percentage, 100)} className="h-2" />
                </div>
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
                <div key={goal.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-neutral-500">
                      {goal.value.toLocaleString()} /{" "}
                      {goal.target.toLocaleString()} {goal.unit}
                    </span>
                  </div>
                  <Progress value={Math.min(goal.percentage, 100)} className="h-2" />
                </div>
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
