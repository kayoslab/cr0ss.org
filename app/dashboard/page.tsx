// app/dashboard/page.tsx
import React from "react";
import NextDynamic from "next/dynamic";
import { kv } from "@vercel/kv";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import DashboardSkeleton from "./Dashboard.skeleton";
import { SECRET_HEADER } from "@/lib/auth/secret";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DashboardClient = NextDynamic(() => import("./Dashboard.client"), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

// ---- absolute URL builder + server fetcher
function resolveBaseUrl() {
  const pub = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (pub) return pub;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

async function jfetchServer<T>(path: string): Promise<T | null> {
  const base = resolveBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const secret = process.env.DASHBOARD_API_SECRET || process.env.CONTENTFUL_REVALIDATE_SECRET || "";

  const headers = new Headers({ accept: "application/json" });
  if (secret) headers.set(SECRET_HEADER, secret);

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

type DashboardApi = {
  cupsToday: number;
  brewMethodsToday: { type: string; count: number }[];
  coffeeOriginThisWeek: { name: string; value: number }[];
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
  runningProgress: { target_km: number; total_km: number; delta_km: number; pct: number; month: string };
  paceSeries: { date: string; pace_sec_per_km: number }[];
  runningHeatmap: { date: string; km: number }[];
  caffeineSeries: { timeISO: string; intake_mg: number; body_mg: number }[];
  sleepPrevCaff: { date: string; sleep_score: number; prev_caffeine_mg: number }[];
  monthlyGoals: {
    steps: number;
    running_distance_km: number;
    reading_minutes: number;
    outdoor_minutes: number;
    writing_minutes: number;
    coding_minutes: number;
    focus_minutes: number;
  };
};

export default async function DashboardPage() {
  // live location (KV)
  const storedLocation = await kv.get<{ lat: number; lon: number }>("GEOLOCATION");
  const lat = Number(storedLocation?.lat ?? 0);
  const lon = Number(storedLocation?.lon ?? 0);

  // Contentful
  const [countries = [], visited = []] = await Promise.all([getAllCountries(), getVisitedCountries(true)]);
  const countriesSlim = countries.map((c: CountryProps) => ({
    id: c.id,
    path: c.data?.path ?? "",
    visited: c.lastVisited != null,
  }));

  // API-first dashboard data
  const api = (await jfetchServer<DashboardApi>("/api/dashboard"))!;
  if (!api) throw new Error("Failed to load dashboard data");
  const goals = api.monthlyGoals ?? {
    running_distance_km: 0,
    steps: 0,
    reading_minutes: 0,
    outdoor_minutes: 0,
    writing_minutes: 0,
    coding_minutes: 0,
    focus_minutes: 0,
  };

  // Map into client-friendly props
  const travel = {
    totalCountries: countries.length,
    visitedCount: visited.length,
    recentVisited: (visited as CountryProps[]).slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
    countries: countriesSlim,
    lat,
    lon,
  };

  const morning = {
    cupsToday: api.cupsToday,
    methodsBar: api.brewMethodsToday.map((b) => ({ name: b.type, value: b.count })),
    originsDonut: api.coffeeOriginThisWeek,
    caffeineDual: api.caffeineSeries.map((p) => ({
      time: new Date(p.timeISO).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        hourCycle: "h23",
      }),
      intake_mg: p.intake_mg,
      body_mg: p.body_mg,
    })),
  };

  const rituals = {
    progressToday: [
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
    ],
    consistencyBars: api.habitsConsistency.map((r) => ({
      name: r.name,
      value: Math.round((r.kept / Math.max(1, r.total)) * 100),
    })),
    rhythmTrend: api.writingVsFocus.map((d) => ({
      date: d.date,
      "Writing (min)": d.writing_minutes,
      "Focus (min)": d.focus_minutes,
    })),
  };

  const running = {
    progress: {
      target_km: api.runningProgress.target_km,
      total_km: api.runningProgress.total_km,
      delta_km: api.runningProgress.delta_km,
    },
    paceSeries: api.paceSeries.map((p) => ({
      date: p.date,
      paceMinPerKm: +(p.pace_sec_per_km / 60).toFixed(2),
    })),
    heatmap: api.runningHeatmap,
  };

  const sleepPrevCaff = api.sleepPrevCaff;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white dark:bg-slate-800">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <DashboardClient
          travel={travel}
          morning={morning}
          rituals={rituals}
          running={running}
          sleepPrevCaff={sleepPrevCaff}
        />
      </section>
    </main>
  );
}
