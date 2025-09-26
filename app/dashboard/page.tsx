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
import { GOALS } from "@/lib/db/constants";
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

  // countries (Contentful)
  const countries = (await getAllCountries()) ?? [];
  const visited = (await getVisitedCountries(true)) ?? [];

  // slim countries for client map
  const countriesSlim = countries.map((c: CountryProps) => ({
    id: c.id,
    path: c.data.path,
    visited: c.lastVisited != null,
  }));

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
      time: new Date(p.timeISO).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      intake_mg: p.intake_mg,
      body_mg: p.body_mg,
    })),
  };

  const rituals = {
    progressToday: [
      { name: "Steps", value: data.habitsToday.steps,            target: GOALS.steps },
      { name: "Reading", value: data.habitsToday.reading_minutes, target: GOALS.minutesRead },
      { name: "Outdoor", value: data.habitsToday.outdoor_minutes, target: GOALS.minutesOutdoors },
      { name: "Writing", value: data.habitsToday.writing_minutes, target: GOALS.writingMinutes },
      { name: "Coding", value: data.habitsToday.coding_minutes,   target: GOALS.codingMinutes },
      { name: "Journaling", value: data.habitsToday.journaled ? 1 : 0, target: 1 },
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
  const sleepPrevCaff = sleepRows.map((r) => {
    const d = new Date(r.date);
    d.setDate(d.getDate() - 1);
    const prevKey = d.toISOString().slice(0, 10);
    return {
      date: r.date,
      sleep_score: r.sleep_score,
      prev_caffeine_mg: Math.round(mgByDate.get(prevKey) ?? 0),
    };
  });


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
