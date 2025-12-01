"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress, Bars, Area } from "@/components/dashboard/charts/shadcn-charts";

type HabitsClientProps = {
  progressToday: { name: string; value: number; target: number }[];
  consistencyBars: { name: string; value: number }[];
  rhythmTrend: { date: string; "Writing (min)": number; "Focus (min)": number }[];
  streaks?: {
    reading: { current: number; longest: number };
    outdoor: { current: number; longest: number };
    writing: { current: number; longest: number };
    coding: { current: number; longest: number };
    steps: { current: number; longest: number };
  };
};

export default function HabitsClient({
  progressToday,
  consistencyBars,
  rhythmTrend,
  streaks,
}: HabitsClientProps) {
  return (
    <div className="space-y-6">
      {/* Habit Streaks Section */}
      {streaks && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Object.entries(streaks).map(([habit, data]) => (
            <div key={habit} className="rounded-xl border border-neutral-200/60 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-neutral-500 uppercase mb-2">
                {habit}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold">{data.current}</span>
                {data.current > 0 && <span className="text-xl">🔥</span>}
                {data.current >= 7 && <Badge variant="success">Week!</Badge>}
                {data.current >= 30 && <Badge variant="primary">Month!</Badge>}
              </div>
              <div className="text-xs text-neutral-400">
                Best: {data.longest} {data.longest === 1 ? "day" : "days"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Today's Progress */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Today's Progress</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {progressToday.map((p) => {
            const percentage = Math.round((p.value / p.target) * 100);
            const isComplete = percentage >= 100;
            const isGood = percentage >= 75;

            return (
              <div key={p.name} className="space-y-2">
                <Progress
                  title={`${p.name} Goal Progress`}
                  value={p.value}
                  target={p.target}
                />
                {isComplete && <Badge variant="success">✓ Complete</Badge>}
                {!isComplete && isGood && <Badge variant="primary">Almost there!</Badge>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Consistency and Trends */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Bars title="Rituals consistency" items={consistencyBars} />
        <div className="md:col-span-2">
          <Area
            title="Writing vs Focus"
            data={rhythmTrend}
            index="date"
            categories={["Writing (min)", "Focus (min)"]}
            colors={["sky", "rose"]}
          />
        </div>
      </div>
    </div>
  );
}
