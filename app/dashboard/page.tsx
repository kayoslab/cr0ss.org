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

  const goals = overviewData.monthlyGoals;

  // Calculate today's snapshot KPIs
  const todaySnapshot = {
    coffeeCups: overviewData.cupsToday,
    steps: overviewData.habitsToday.steps,
    activeMinutes:
      overviewData.workoutHeatmap[overviewData.workoutHeatmap.length - 1]
        ?.duration_min || 0,
    countriesVisited: visited.length,
  };

  // Top 3 monthly goals for overview
  const topGoals = [
    {
      name: "Running",
      value: overviewData.runningProgress.total_km,
      target: overviewData.runningProgress.target_km,
      unit: "km",
      percentage: Math.round(
        (overviewData.runningProgress.total_km /
          overviewData.runningProgress.target_km) *
          100
      ),
    },
    {
      name: "Reading",
      value: overviewData.habitsToday.reading_minutes,
      target: goals.reading_minutes,
      unit: "min",
      percentage: Math.round(
        (overviewData.habitsToday.reading_minutes / goals.reading_minutes) *
          100
      ),
    },
    {
      name: "Steps",
      value: overviewData.habitsToday.steps,
      target: goals.steps,
      unit: "steps",
      percentage: Math.round(
        (overviewData.habitsToday.steps / goals.steps) * 100
      ),
    },
  ];

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

      {/* Monthly Goals Progress */}
      <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Monthly Goals</h3>
        <div className="space-y-4">
          {topGoals.map((goal) => (
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
