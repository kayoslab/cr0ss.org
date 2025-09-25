// app/dashboard/page.tsx
import React from "react";
import NextDynamic from "next/dynamic";
import Map from "@/components/map";

import { kv } from "@vercel/kv";
import { getDashboardData } from "@/lib/cache/dashboard";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import { qBerlinTodayBounds, qCoffeeEventsForDayWithLookback } from "@/lib/db/queries";
import { getBodyProfile } from "@/lib/user/profile";
import { modelCaffeine } from "@/lib/phys/caffeine";
import { GOALS } from "@/lib/db/constants";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Client-only widgets/charts
const DashboardClient = NextDynamic(() => import("./Dashboard.client"), { ssr: false });

function MapHero({ lat, lon }: { lat: number; lon: number }) {
  // Transparent wrapper; clipped and responsive. No bg-* here.
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
      <div
        className="
          relative w-full overflow-hidden rounded-xl
          border border-neutral-200/60 dark:border-neutral-700 shadow-sm
        "
      >
        <div className="w-full">
          <Map lat={lat} lon={lon} className="block w-full h-auto" />
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  // ---- live location from KV
  const storedLocation = await kv.get<{ lat: number; lon: number }>("GEOLOCATION");

  // ---- cached server data for dashboard
  const data = await getDashboardData();

  // ---- countries (server-only)
  const countries = (await getAllCountries()) ?? [];
  const visited = (await getVisitedCountries(true)) ?? [];

  // ---- caffeine modeling (server)
  const { startISO, endISO } = await qBerlinTodayBounds();
  const body = await getBodyProfile();
  const half = body.half_life_hours ?? 5;
  const lookbackH = Math.max(24, Math.ceil(half * 4)); // capture carry-over

  const events = await qCoffeeEventsForDayWithLookback(startISO, endISO, lookbackH);

  const series = modelCaffeine(events, body, {
    startMs: Date.parse(startISO),
    endMs: Date.parse(endISO),
    alignToHour: true,
    gridMinutes: 60,
    halfLifeHours: body.half_life_hours ?? undefined,
  });

  // ---- shape props for client

  const travel = {
    totalCountries: countries.length,
    visitedCount: visited.length,
    recentVisited: (visited as CountryProps[]).slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
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
      { name: "Steps", value: data.habitsToday.steps, target: GOALS.steps },
      { name: "Reading", value: data.habitsToday.reading_minutes, target: GOALS.minutesRead },
      { name: "Outdoor", value: data.habitsToday.outdoor_minutes, target: GOALS.minutesOutdoors },
      { name: "Writing", value: data.habitsToday.writing_minutes, target: GOALS.writingMinutes },
      { name: "Coding", value: data.habitsToday.coding_minutes, target: GOALS.codingMinutes },
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
    heatmap: data.runningHeatmap, // [{ date, km }]
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white dark:bg-slate-800">
      <MapHero lat={storedLocation?.lat ?? 0} lon={storedLocation?.lon ?? 0} />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <DashboardClient
          travel={travel}
          morning={morning}
          rituals={rituals}
          running={running}
        />
      </section>
    </main>
  );
}
