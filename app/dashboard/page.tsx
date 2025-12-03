import React from "react";
import Link from "next/link";
import { MapPin, Coffee, Activity, BookOpen, Lightbulb } from "lucide-react";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import { getCurrentLocation } from "@/lib/db/location";
import { getOverviewDashboardData } from "@/lib/db/dashboard";
import { isoToBerlinDate } from "@/lib/time/berlin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Use edge runtime for better performance
export const runtime = "edge";

// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export default async function DashboardPage() {
  // Get current location from database view
  const currentLocation = await getCurrentLocation();
  const lat = currentLocation?.latitude ?? 0;
  const lon = currentLocation?.longitude ?? 0;
  const hasLocation = currentLocation != null;

  // Fetch overview dashboard data (combines multiple domains)
  const overviewData = await getOverviewDashboardData();

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

  const monthlyGoals = overviewData.monthlyGoals;
  const dailyGoals = overviewData.dailyGoals;

  // Calculate today's snapshot KPIs
  const todaySnapshot = {
    coffeeCups: overviewData.cupsToday,
    steps: overviewData.habitsToday.steps,
    activeMinutes:
      overviewData.workoutHeatmap[overviewData.workoutHeatmap.length - 1]
        ?.duration_min || 0,
    countriesVisited: visited.length,
  };

  // Build all goals with their progress
  const allGoals: Array<{
    name: string;
    value: number;
    target: number;
    unit: string;
    percentage: number;
    period: "monthly" | "daily";
  }> = [];

  // Goal metadata: maps goal keys to display info and how to get current value
  const goalMetadata: Record<string, {
    name: string;
    unit: string;
    getValue: (data: typeof overviewData) => number;
  }> = {
    running_distance_km: {
      name: "Running",
      unit: "km",
      getValue: (data) => data.runningProgress.total_km,
    },
    steps: {
      name: "Steps",
      unit: "steps",
      getValue: (data) => data.habitsToday.steps || 0,
    },
    reading_minutes: {
      name: "Reading",
      unit: "min",
      getValue: (data) => data.habitsToday.reading_minutes || 0,
    },
    outdoor_minutes: {
      name: "Outdoors",
      unit: "min",
      getValue: (data) => data.habitsToday.outdoor_minutes || 0,
    },
    writing_minutes: {
      name: "Writing",
      unit: "min",
      getValue: (data) => data.habitsToday.writing_minutes || 0,
    },
    coding_minutes: {
      name: "Coding",
      unit: "min",
      getValue: (data) => data.habitsToday.coding_minutes || 0,
    },
    focus_minutes: {
      name: "Focus",
      unit: "min",
      getValue: (data) => data.habitsToday.focus_minutes || 0,
    },
  };

  // Process monthly goals
  for (const [key, target] of Object.entries(monthlyGoals)) {
    if (target > 0 && goalMetadata[key]) {
      const meta = goalMetadata[key];
      const value = meta.getValue(overviewData);
      allGoals.push({
        name: meta.name,
        value,
        target,
        unit: meta.unit,
        percentage: Math.round((value / target) * 100),
        period: "monthly",
      });
    }
  }

  // Process daily goals
  for (const [key, target] of Object.entries(dailyGoals)) {
    if (target > 0 && goalMetadata[key]) {
      const meta = goalMetadata[key];
      const value = meta.getValue(overviewData);
      allGoals.push({
        name: meta.name,
        value,
        target,
        unit: meta.unit,
        percentage: Math.round((value / target) * 100),
        period: "daily",
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
