import React from "react";
import Link from "next/link";
import { MapPin, Coffee, Activity, BookOpen, Lightbulb } from "lucide-react";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import { getCurrentLocation } from "@/lib/db/location";
import { getDashboardData } from "@/lib/db/dashboard";
import { isoToBerlinDate } from "@/lib/time/berlin";

// Use edge runtime for better performance
export const runtime = "edge";

// fetch settings - force runtime rendering, no static generation
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0; // Never use cache

export default async function DashboardPage() {
  // Get current location from database view
  const currentLocation = await getCurrentLocation();
  const lat = currentLocation?.latitude ?? 0;
  const lon = currentLocation?.longitude ?? 0;
  const hasLocation = currentLocation != null;

  // Fetch dashboard data directly from database (no API route)
  const dashboardData = await getDashboardData();

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

  const goals = dashboardData.monthlyGoals ?? {
    running_distance_km: 0,
    steps: 0,
    reading_minutes: 0,
    outdoor_minutes: 0,
    writing_minutes: 0,
    coding_minutes: 0,
    focus_minutes: 0,
  };

  // Calculate today's snapshot KPIs
  const todaySnapshot = {
    coffeeCups: dashboardData.cupsToday,
    steps: dashboardData.habitsToday.steps,
    activeMinutes:
      dashboardData.workoutHeatmap[dashboardData.workoutHeatmap.length - 1]
        ?.duration_min || 0,
    countriesVisited: visited.length,
  };

  // Top 3 monthly goals for overview
  const topGoals = [
    {
      name: "Running",
      value: dashboardData.runningProgress.total_km,
      target: dashboardData.runningProgress.target_km,
      unit: "km",
      percentage: Math.round(
        (dashboardData.runningProgress.total_km /
          dashboardData.runningProgress.target_km) *
          100
      ),
    },
    {
      name: "Reading",
      value: dashboardData.habitsToday.reading_minutes,
      target: goals.reading_minutes,
      unit: "min",
      percentage: Math.round(
        (dashboardData.habitsToday.reading_minutes / goals.reading_minutes) *
          100
      ),
    },
    {
      name: "Steps",
      value: dashboardData.habitsToday.steps,
      target: goals.steps,
      unit: "steps",
      percentage: Math.round(
        (dashboardData.habitsToday.steps / goals.steps) * 100
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
        <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-neutral-500">Coffee Cups</div>
          <div className="mt-2 text-3xl font-bold">{todaySnapshot.coffeeCups}</div>
          <div className="text-xs text-neutral-400 mt-1">Today</div>
        </div>

        <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-neutral-500">Steps</div>
          <div className="mt-2 text-3xl font-bold">
            {todaySnapshot.steps.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Today</div>
        </div>

        <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-neutral-500">
            Active Minutes
          </div>
          <div className="mt-2 text-3xl font-bold">
            {todaySnapshot.activeMinutes}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Today</div>
        </div>

        <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-neutral-500">Countries</div>
          <div className="mt-2 text-3xl font-bold">
            {todaySnapshot.countriesVisited}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Visited</div>
        </div>
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
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all bg-[color:var(--chart-1)]"
                  style={{
                    width: `${Math.min(goal.percentage, 100)}%`
                  }}
                />
              </div>
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
