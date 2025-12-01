import React from "react";
import { SECRET_HEADER } from "@/lib/auth/constants";
import { env } from "@/env";
import HabitsClient from "./habits.client";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Habits & Productivity | Dashboard",
  description: "Track your daily habits and productivity metrics",
};

// ---- absolute URL builder + server fetcher
function resolveBaseUrl() {
  const pub = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (pub) return pub;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

type JRes<T> = { ok: true; data: T } | { ok: false; status: number };
async function jfetchServer<T>(path: string): Promise<JRes<T>> {
  const base = resolveBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers = new Headers({ accept: "application/json" });
  const secret = env.DASHBOARD_API_SECRET;
  headers.set(SECRET_HEADER, secret);
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: (await res.json()) as T };
}

type DashboardApi = {
  habitsToday: {
    steps: number;
    reading_minutes: number;
    outdoor_minutes: number;
    writing_minutes: number;
    coding_minutes: number;
    focus_minutes: number;
  };
  habitsConsistency: { name: string; kept: number; total: number }[];
  writingVsFocus: { date: string; writing_minutes: number; focus_minutes: number }[];
  monthlyGoals: {
    steps: number;
    running_distance_km: number;
    reading_minutes: number;
    outdoor_minutes: number;
    writing_minutes: number;
    coding_minutes: number;
    focus_minutes: number;
  };
  sleepPrevCaff: { date: string; sleep_score: number; prev_caffeine_mg: number; prev_day_workout: boolean }[];
};

export default async function HabitsPage() {
  // usage
  const apiRes = await jfetchServer<DashboardApi>("/api/dashboard");
  if (!apiRes.ok) throw new Error(`Failed to load dashboard data (HTTP ${apiRes.status})`);
  const api = apiRes.data;

  const goals = api.monthlyGoals ?? {
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
      value: api.habitsToday.steps,
      target: goals.steps
    }, {
      name: "Reading",
      value: api.habitsToday.reading_minutes,
      target: goals.reading_minutes
    }, {
      name: "Outdoor",
      value: api.habitsToday.outdoor_minutes,
      target: goals.outdoor_minutes
    }, {
      name: "Writing",
      value: api.habitsToday.writing_minutes,
      target: goals.writing_minutes
    }, {
      name: "Coding",
      value: api.habitsToday.coding_minutes,
      target: goals.coding_minutes
    },
  ];

  const consistencyBars = api.habitsConsistency.map((r) => ({
    name: r.name,
    value: Math.round((r.kept / Math.max(1, r.total)) * 100),
  }));

  const rhythmTrend = api.writingVsFocus.map((d) => ({
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
        <h2 className="text-2xl font-bold tracking-tight">Habits & Productivity</h2>
        <p className="text-muted-foreground">
          Track your daily habits, productivity metrics, streaks, and consistency.
        </p>
      </div>

      <HabitsClient
        progressToday={progressToday}
        consistencyBars={consistencyBars}
        rhythmTrend={rhythmTrend}
        streaks={streaks}
        sleepPrevCaff={api.sleepPrevCaff}
      />
    </div>
  );
}
