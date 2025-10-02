"use client";

import React, { useEffect } from "react";
import Section from "@/components/dashboard/Section";
import { Kpi } from "@/components/dashboard/Kpi";
import {
  Donut,
  Line,
  Area,
  Bars,
  Progress,
  Panel,
  Scatter,
} from "@/components/dashboard/charts/TremorCharts";
import MapClient, { TravelCountry } from "@/components/map.client";

/** Make Tremor legends screen-reader friendly and keyboard sane */
function LegendA11y() {
  useEffect(() => {
    const containers = document.querySelectorAll<HTMLElement>('[data-testid="tremor-legend"]');
    containers.forEach((c) => {
      // container should be a list
      c.setAttribute("role", "list");
      // each item should be a listitem; its icon is decorative
      c.querySelectorAll("li").forEach((li) => {
        li.setAttribute("role", "listitem");
        const icon = li.querySelector("svg");
        if (icon) {
          icon.setAttribute("aria-hidden", "true");
          icon.setAttribute("focusable", "false");
        }
      });
    });
  }, []);
  return null;
}

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
      {/* run legend a11y upgrade once */}
      <LegendA11y />

      {/* 1) Travel */}
      <Section id="travel" title="1. Travel" className="scroll-mt-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Map card */}
          <div className="md:col-span-3">
            <div className="rounded-xl border border-neutral-200/60 dark:border-neutral-700 shadow-sm">
              <div className="p-2 sm:p-3 md:p-4">
                <MapClient
                  lat={travel.lat}
                  lon={travel.lon}
                  countries={travel.countries}
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

      {/* 2) Daily Rituals */}
      <Section id="daily-rituals" title="2. Daily Rituals" className="scroll-mt-20">
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

      {/* 3) Morning Brew */}
      <Section id="morning-brew" title="3. Morning Brew" className="scroll-mt-20">
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
      </Section>

      {/* 4) Focus & Flow */}
      <Section id="focus-flow" title="4. Focus & Flow" className="scroll-mt-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Scatter
              title="Sleep score vs yesterday’s caffeine"
              data={sleepPrevCaff}
              x="prev_caffeine_mg"
              y="sleep_score"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Each dot is a day (last 60). X: Estimated remaining caffeine (mg) at the end of the day. Y: sleep score for that day.
            </p>
          </div>
        </div>
      </Section>

      {/* 5) Running & Movement */}
      <Section id="running-movement" title="5. Running & Movement" className="scroll-mt-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi label="This Month (km)" value={running.progress.total_km.toFixed(1)} />
          <Kpi label="Goal (km)" value={running.progress.target_km.toFixed(1)} />
          <Kpi label="Delta (km)" value={running.progress.delta_km.toFixed(1)} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-1">
          <Line title="Pace (min/km)" data={running.paceSeries} index="date" categories={["paceMinPerKm"]} />
        </div>

        <div className="mt-4">
          <Panel title="Running Heat (last 6 weeks)">
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const max = Math.max(1, ...running.heatmap.map((d) => d.km));
                return running.heatmap.map(({ date, km }, i) => {
                  const bg = km === 0 ? "bg-neutral-700" : "bg-emerald-500";
                  const opacity = km === 0 ? 1 : Math.max(0.2, Math.min(1, km / max));
                  return (
                    <div
                      key={`${date}-${i}`}
                      className={`h-4 w-4 rounded-sm ${bg}`}
                      title={`${date}: ${km.toFixed(2)} km`}
                      style={{ opacity }}
                    />
                  );
                });
              })()}
            </div>
          </Panel>
        </div>
      </Section>
    </div>
  );
}
