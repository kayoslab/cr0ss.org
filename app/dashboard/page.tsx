// app/dashboard/page.tsx
import React from "react";
import NextDynamic from "next/dynamic";
import { kv } from "@vercel/kv";

import { getDashboardData } from "@/lib/cache/dashboard";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import { qBerlinTodayBounds, qCoffeeEventsForDayWithLookback } from "@/lib/db/queries";
import { getBodyProfile } from "@/lib/user/profile";
import { modelCaffeine } from "@/lib/phys/caffeine";
import { qCoffeeInRange, qSleepVsFocusScatter } from "@/lib/db/queries";
import { estimateIntakeMgFor } from "@/lib/phys/caffeine";
import DashboardSkeleton from "./Dashboard.skeleton";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DashboardClient = NextDynamic(() => import("./Dashboard.client"), { 
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

export default async function DashboardPage() {
  // live location (KV)
  const storedLocation = await kv.get<{ lat: number; lon: number }>("GEOLOCATION");
  const lat = storedLocation?.lat ?? 0;
  const lon = storedLocation?.lon ?? 0;

  // cached server data
  const data = await getDashboardData();

  // countries (Contentful) in parallel
  const [countries = [], visited = []] = await Promise.all([
    getAllCountries(),
    getVisitedCountries(true),
  ]);

  // slim countries for client map (defensive path access)
  const countriesSlim = countries.map((c: CountryProps) => ({
    id: c.id,
    path: c.data?.path ?? "", // empty path safely renders nothing for that country
    visited: c.lastVisited != null,
  }));

  // Build an absolute URL for server-side fetches.
function resolveBaseUrl() {
  // Prefer explicit public site URL (production), then Vercel URL, then localhost (dev)
  const pub = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (pub) return pub;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

// Minimal server-side JSON fetcher that adds the secret header and disables caching.
async function jfetchServer<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const base = resolveBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const secret = process.env.DASHBOARD_API_SECRET || process.env.CONTENTFUL_REVALIDATE_SECRET || "";

  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (secret) headers.set("x-vercel-revalidation-key", secret);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}
// Default goals if none are set

  type Goals = {
  running_distance_km: number;
  steps: number;
  reading_minutes: number;
  outdoor_minutes: number;
  writing_minutes: number;
  coding_minutes: number;
  focus_minutes: number;
};

const DEFAULT_GOALS: Goals = {
  running_distance_km: 0,
  steps: 0,
  reading_minutes: 0,
  outdoor_minutes: 0,
  writing_minutes: 0,
  coding_minutes: 0,
  focus_minutes: 0,
};

// ...
// goals (API-first)
const goals = (await jfetchServer<Goals>("/api/habits/goal")) ?? DEFAULT_GOALS;


  // caffeine model for today incl. carryover
  const { startISO, endISO } = await qBerlinTodayBounds();
  const body = await getBodyProfile();
  const half = body.half_life_hours ?? 5;
  const lookbackH = Math.max(24, Math.ceil(half * 4));
  const events = await qCoffeeEventsForDayWithLookback(startISO, endISO, lookbackH);

  const series = modelCaffeine(events, body, {
    startMs: Date.parse(startISO),
    endMs: Date.parse(endISO),
    alignToHour: true,
    gridMinutes: 60,
    halfLifeHours: body.half_life_hours ?? undefined,
  });

  // props for client
  const travel = {
    totalCountries: countries.length,
    visitedCount: visited.length,
    recentVisited: (visited as CountryProps[]).slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
    countries: countriesSlim,
    lat,
    lon,
  };

  const morning = {
    cupsToday: data.cupsToday,
    methodsBar: data.brewMethodsToday.map((b) => ({ name: b.type, value: b.count })),
    originsDonut: data.coffeeOriginThisWeek,
    caffeineDual: series.map((p) => ({
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
        value: data.habitsToday.steps,
        target: goals.steps
      }, {
        name: "Reading",
        value: data.habitsToday.reading_minutes,
        target: goals.reading_minutes
      }, {
        name: "Outdoor",
        value: data.habitsToday.outdoor_minutes,
        target: goals.outdoor_minutes
      }, { 
        name: "Writing",
        value: data.habitsToday.writing_minutes,
        target: goals.writing_minutes
      }, { 
        name: "Coding",
        value: data.habitsToday.coding_minutes,
        target: goals.coding_minutes
      },
    ],
    consistencyBars: data.habitsConsistency.map((r) => ({
      name: r.name,
      value: Math.round((r.kept / Math.max(1, r.total)) * 100),
    })),
    rhythmTrend: data.writingVsFocus.map((d) => ({
      date: d.date,
      "Writing (min)": d.writing_minutes,
      "Focus (min)": d.focus_minutes,
    })),
  };

  // ---- Sleep vs previous-day caffeine (last 60 days)
  // Reuse sleep rows from the existing scatter helper (we only need the date + sleep_score)
  const sleepRows = await qSleepVsFocusScatter(60); // [{date, sleep_score, focus_minutes}]
  // Build the range we need: from min(sleep date) - 1 day to max(sleep date)
  const minDate = sleepRows.length ? new Date(sleepRows[0].date) : new Date();
  const maxDate = sleepRows.length ? new Date(sleepRows[sleepRows.length - 1].date) : new Date();
  const startRange = new Date(minDate);
  startRange.setDate(startRange.getDate() - 1); // need the *previous* day too
  const startISOAll = startRange.toISOString().slice(0, 10) + "T00:00:00.000Z";
  const endISOAll   = new Date(maxDate.getTime() + 24*3600*1000).toISOString(); // exclusive

  // Get all coffee events in the range once
  const rangeEvents = await qCoffeeInRange(startISOAll, endISOAll);

  // Sum caffeine per *calendar date* of consumption
  const mgByDate = new Map<string, number>();
  for (const ev of rangeEvents) {
    const d = ev.time.slice(0, 10); // YYYY-MM-DD of the event
    const mg = estimateIntakeMgFor(ev.type, ev.amount_ml);
    mgByDate.set(d, (mgByDate.get(d) ?? 0) + mg);
  }

  // For each sleep date, look up previous day's mg
  const sleepPrevCaff = sleepRows
    .map((r) => {
      const d = new Date(r.date);
      d.setDate(d.getDate() - 1);
      const prevKey = d.toISOString().slice(0, 10);
      return {
        date: r.date,
        sleep_score: r.sleep_score,
        prev_caffeine_mg: Math.round(mgByDate.get(prevKey) ?? 0),
      };
    }
  ).filter((p) => !(p.prev_caffeine_mg === 0 && (!p.sleep_score || p.sleep_score === 0)));

  const running = {
    progress: {
      target_km: data.runningProgress.target_km,
      total_km: data.runningProgress.total_km,
      delta_km: data.runningProgress.delta_km,
    },
    paceSeries: data.paceSeries.map((p) => ({
      date: p.date,
      paceMinPerKm: +(p.pace_sec_per_km / 60).toFixed(2),
    })),
    heatmap: data.runningHeatmap,
  };

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
