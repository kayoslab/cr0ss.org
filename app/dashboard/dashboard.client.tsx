"use client";

import React from "react";
import Link from "next/link";
import Section from "@/components/dashboard/section";
import { Kpi } from "@/components/dashboard/kpi";
import {
  Donut,
  Line,
  Area,
  Bars,
  Progress,
  Panel,
  Scatter,
} from "@/components/dashboard/charts/shadcn-charts";
import MapClient, { TravelCountry } from "@/components/map.client";

// Removed LegendA11y - shadcn charts have proper accessibility built in

type TravelProps = {
  totalCountries: number;
  visitedCount: number;
  recentVisited: { id: string; name: string }[];
  countries: TravelCountry[];
  lat: number;
  lon: number;
  hasLocation: boolean;
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

type WorkoutProps = {
  heatmap: { date: string; duration_min: number; workouts: { type: string; duration_min: number }[] }[];
  types: string[];
  stats: { workout_type: string; count: number; total_duration_min: number; total_distance_km: number }[];
};

type SleepPrevCaffPoint = { date: string; sleep_score: number; prev_caffeine_mg: number; prev_day_workout: boolean };

export default function DashboardClient({
  travel,
  morning,
  rituals,
  running,
  workouts,
  sleepPrevCaff,
}: {
  travel: TravelProps | null;
  morning: MorningProps | null;
  rituals: RitualsProps | null;
  running: RunningProps | null;
  workouts: WorkoutProps | null;
  sleepPrevCaff: SleepPrevCaffPoint[];
}) {
  return (
    <div className="space-y-10">

      {/* 1) Travel */}
      {travel && (
      <Section title="Travel" id="travel" className="scroll-mt-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Map card */}
          <div className="md:col-span-3">
            <div className="rounded-xl border border-neutral-200/60 shadow-sm">
              <div className="p-2 sm:p-3 md:p-4">
                <MapClient
                  lat={travel.lat}
                  lon={travel.lon}
                  countries={travel.countries}
                  showLocation={travel.hasLocation}
                  className="block w-full h-auto"
                />
              </div>
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
      )}

      {/* 2) Daily Rituals */}
      {rituals && (
      <Section title="Daily Rituals" id="daily-rituals" className="scroll-mt-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
              colors={["sky", "rose"]}
            />
          </div>
        </div>
      </Section>
      )}

      {/* 3) Morning Brew */}
      {morning && (
      <Section title="Morning Brew" id="morning-brew" className="scroll-mt-20">
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
          <p className="mt-2 text-xs text-neutral-500">
            Intake: caffeine consumed (mg) at that time. Body: modeled remaining caffeine (mg) in body over the day.
          </p>
        </div>

        <div className="mt-4 gap-4">
          <Link
            href="/coffee"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 border border-neutral-200 rounded-lg hover:bg-neutral-200 hover:border-neutral-300 transition-all shadow-sm"
          >
            View Coffee Collection
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </Section>
      )}

      {/* 4) Workouts */}
      {(running || workouts) && (
      <Section title="Running & Movement" id="running-movement" className="scroll-mt-20">
        {/* Heatmap first - shows all workout types */}
        <Panel title="Activity Heatmap">
          <div className="grid grid-cols-10 gap-1">
            {(() => {
              if (!workouts) return null;
              const max = Math.max(1, ...workouts.heatmap.map((d) => d.duration_min));
              return workouts.heatmap.map(({ date, duration_min, workouts: dayWorkouts }, i) => {
                const bg = duration_min === 0 ? "bg-neutral-700" : "bg-emerald-500";
                const opacity = duration_min === 0 ? 1 : Math.max(0.2, Math.min(1, duration_min / max));

                return (
                  <div
                    key={`${date}-${i}`}
                    className="relative h-4 w-4 rounded-sm group cursor-pointer"
                  >
                    {/* Colored square with opacity */}
                    <div
                      className={`absolute inset-0 rounded-sm ${bg}`}
                      style={{ opacity }}
                    />

                    {/* Tooltip on hover - always full opacity */}
                    {duration_min > 0 && dayWorkouts.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                        <div className="bg-white text-black text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-xl border border-gray-200">
                          <div className="font-semibold">{date}</div>
                          <div className="text-black">
                            {dayWorkouts.map(w =>
                              `${w.duration_min} min ${w.type.charAt(0).toUpperCase() + w.type.slice(1)}`
                            ).join(', ')}
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </Panel>

        {/* One KPI per workout type */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {workouts?.stats.map((stat) => {
            const typeName = stat.workout_type.charAt(0).toUpperCase() + stat.workout_type.slice(1);
            return (
              <Kpi
                key={stat.workout_type}
                label={`${typeName} Sessions`}
                value={stat.count}
              />
            );
          })}
        </div>

        {/* Scatter showing the correlation between workouts, coffee and sleep */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Scatter
              title="Caffeine &amp; Workouts and their effect on sleep score"
              data={sleepPrevCaff.map(p => ({
                date: p.date,
                sleep_score: p.sleep_score,
                prev_caffeine_mg: p.prev_caffeine_mg,
                category: p.prev_day_workout ? "Workout day before" : "No workout day before"
              }))}
              x="prev_caffeine_mg"
              y="sleep_score"
              groupField="category"
              colors={["emerald", "violet"]}
            />
            <p className="mt-2 text-xs text-neutral-500">
              Each dot is a day — X: Estimated remaining caffeine (mg) at the end of the day before. Y: sleep score.
              Green dots: no workout day before. Purple dots: workout day before.
            </p>
          </div>
        </div>
      </Section>
      )}
    </div>
  );
}
