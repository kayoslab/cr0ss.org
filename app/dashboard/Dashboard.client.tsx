// app/dashboard/Dashboard.client.tsx
"use client";

import React from "react";
import Section from "@/components/dashboard/Section";
import { Kpi } from "@/components/dashboard/Kpi";
import { Donut, Line, Area, Bars, Progress, Panel, Scatter } from "@/components/dashboard/charts/TremorCharts";
import MapClient, { TravelCountry } from "@/components/map.client";

type TravelProps = {
  totalCountries: number;
  visitedCount: number;
  recentVisited: { id: string; name: string }[];
  countries: TravelCountry[];
  lat: number;
  lon: number;
};

type MorningProps = {
  cupsToday: number;
  methodsBar: { name: string; value: number }[];
  originsDonut: { name: string; value: number }[];
  caffeineDual: { time: string; intake_mg: number; body_mg: number }[];
};

type RitualsProps = {
  progressToday: { name: string; value: number; target: number }[];
  consistencyBars: { name: string; value: number }[];
  rhythmTrend: { date: string; "Writing (min)": number; "Focus (min)": number }[];
};

type RunningProps = {
  progress: { target_km: number; total_km: number; delta_km: number };
  paceSeries: { date: string; paceMinPerKm: number }[];
  heatmap: { date: string; km: number }[];
};

type SleepPrevCaffPoint = { date: string; sleep_score: number; prev_caffeine_mg: number };

export default function DashboardClient({
  travel,
  morning,
  rituals,
  running,
  sleepPrevCaff,
}: {
  travel: TravelProps;
  morning: MorningProps;
  rituals: RitualsProps;
  running: RunningProps;
  sleepPrevCaff: SleepPrevCaffPoint[];
}) {
  return (
    <div className="space-y-10">
      {/* 1) Travel */}
      <Section title="1. Travel">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Map card — full-width on mobile, spans 2 cols on md for balance */}
          <div className="md:col-span-3 xl:col-span-3">
            <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-700 shadow-sm">
              {/* Responsive SVG inside; no fixed width → no iOS overflow */}
              <MapClient
                lat={travel.lat}
                lon={travel.lon}
                countries={travel.countries}
                className="block w-full h-auto"
              />
            </div>
          </div>

          <Kpi label="Visited Countries" value={travel.visitedCount} />
          <Panel title="Last Visited">
            {travel.recentVisited.length ? (
              <div className="space-y-1">
                {travel.recentVisited.map((c) => (
                  <div key={c.id} className="text-m">
                    {c.name} ({c.id})
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-500">No data yet.</div>
            )}
          </Panel>
          <Donut
            title="Countries"
            data={[
              { name: "Visited", value: travel.visitedCount },
              { name: "Not Visited", value: Math.max(0, travel.totalCountries - travel.visitedCount) },
            ]}
          />
        </div>
      </Section>

      {/* 2) Morning Brew */}
      <Section title="2. Morning Brew">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi label="Cups Today" value={morning.cupsToday} />
          <Bars title="Brew methods today" items={morning.methodsBar} />
          <Donut title="Coffee origins (7d)" data={morning.originsDonut} />
        </div>

        <div className="mt-4">
          <Line
            title="Caffeine: intake vs body load (00:00–24:00)"
            data={morning.caffeineDual}
            index="time"
            categories={["intake_mg", "body_mg"]}
            colors={["emerald", "violet"]}
          />
        </div>
      </Section>

      {/* 3) Daily Rituals */}
      <Section title="3. Daily Rituals">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {rituals.progressToday.map((p) => (
            <Progress key={p.name} title={`${p.name} Goal Progress`} value={p.value} target={p.target} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Bars title="Rituals consistency" items={rituals.consistencyBars} />
          <div className="md:col-span-2">
            <Area
              title="Writing vs Focus"
              data={rituals.rhythmTrend}
              index="date"
              categories={["Writing (min)", "Focus (min)"]}
            />
          </div>
          <div className="md:col-span-3">
            <Scatter
              title="Sleep score vs yesterday’s caffeine"
              data={sleepPrevCaff}
              x="prev_caffeine_mg"
              y="sleep_score"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Each dot is a day. Hover for date; use this to eyeball correlation between rest and caffeine consumption.
            </p>
          </div>
        </div>
      </Section>


      {/* 4) Running & Movement */}
      <Section title="4. Running & Movement">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi label="This Month (km)" value={running.progress.total_km.toFixed(1)} />
          <Kpi label="Goal (km)" value={running.progress.target_km.toFixed(1)} />
          <Kpi label="Delta (km)" value={running.progress.delta_km.toFixed(1)} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Progress title="Running Progress" value={running.progress.total_km} target={running.progress.target_km} />
          <div className="md:col-span-2">
            <Line title="Pace (min/km)" data={running.paceSeries} index="date" categories={["paceMinPerKm"]} />
          </div>
        </div>

        {/* Heat grid */}
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-neutral-400">Running Heat (last 6 weeks)</h3>
          <div className="grid grid-cols-7 gap-1">
            {running.heatmap.map(({ date, km }, i) => {
              const bg = km === 0 ? "bg-neutral-800" : "bg-emerald-500";
              const opacity = km === 0 ? 1 : 0.2 + Math.min(0.8, km / 10);
              return (
                <div
                  key={`${date}-${i}`}
                  className={`h-4 w-4 rounded-sm ${bg}`}
                  title={`${date}: ${km.toFixed(2)} km`}
                  style={{ opacity }}
                />
              );
            })}
          </div>
        </div>
      </Section>
    </div>
  );
}
