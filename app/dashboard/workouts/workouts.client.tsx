"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Kpi } from "@/components/dashboard/kpi";
import { Panel } from "@/components/dashboard/charts/shadcn-charts";

type WorkoutStats = {
  workout_type: string;
  count: number;
  total_duration_min: number;
  total_distance_km: number;
};

type WorkoutHeatmapDay = {
  date: string;
  duration_min: number;
  workouts: { type: string; duration_min: number }[];
};

type WorkoutsClientProps = {
  workoutTypes: string[];
  workoutStats: WorkoutStats[];
  workoutHeatmap: WorkoutHeatmapDay[];
  currentStreak?: number;
  longestStreak?: number;
  personalRecords?: {
    longestRun?: { distance_km: number; date: string };
    fastestPace?: { pace_min_per_km: number; date: string };
    mostWorkoutsWeek?: { count: number; week: string };
  };
};

export default function WorkoutsClient({
  workoutTypes,
  workoutStats,
  workoutHeatmap,
  currentStreak = 0,
  longestStreak = 0,
  personalRecords,
}: WorkoutsClientProps) {
  // Get all workout types for tabs
  const allTypes = ["all", ...workoutTypes];

  // Filter heatmap by workout type
  const getFilteredHeatmap = (type: string) => {
    if (type === "all") return workoutHeatmap;

    return workoutHeatmap.map(day => ({
      ...day,
      workouts: day.workouts.filter(w => w.type === type),
      duration_min: day.workouts
        .filter(w => w.type === type)
        .reduce((sum, w) => sum + w.duration_min, 0),
    }));
  };

  // Get stats for specific type
  const getStatsForType = (type: string) => {
    if (type === "all") return workoutStats;
    return workoutStats.filter(s => s.workout_type === type);
  };

  return (
    <div className="space-y-6">

      {/* Streaks and Records Section */}
      {(currentStreak > 0 || personalRecords) && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {currentStreak > 0 && (
            <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-neutral-500">Current Streak</div>
              <div className="mt-2 text-3xl font-bold flex items-center gap-2">
                {currentStreak}
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {currentStreak === 1 ? "day" : "days"}
              </div>
            </div>
          )}

          {longestStreak > 0 && (
            <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-neutral-500">Longest Streak</div>
              <div className="mt-2 text-3xl font-bold flex items-center gap-2">
                {longestStreak}
                <span className="text-2xl">⭐</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {longestStreak === 1 ? "day" : "days"}
              </div>
            </div>
          )}

          {personalRecords?.longestRun && (
            <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-neutral-500">Longest Run</div>
                <Badge variant="success">PR</Badge>
              </div>
              <div className="mt-2 text-3xl font-bold">
                {personalRecords.longestRun.distance_km.toFixed(1)}
                <span className="text-lg text-neutral-400 ml-1">km</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {new Date(personalRecords.longestRun.date).toLocaleDateString()}
              </div>
            </div>
          )}

          {personalRecords?.fastestPace && (
            <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-neutral-500">Fastest Pace</div>
                <Badge variant="success">PR</Badge>
              </div>
              <div className="mt-2 text-3xl font-bold">
                {personalRecords.fastestPace.pace_min_per_km.toFixed(1)}
                <span className="text-lg text-neutral-400 ml-1">min/km</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {new Date(personalRecords.fastestPace.date).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs for workout types */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          {allTypes.map((type) => (
            <TabsTrigger key={type} value={type} className="capitalize">
              {type}
              {type !== "all" && (
                <Badge variant="secondary" className="ml-2">
                  {workoutStats.find(s => s.workout_type === type)?.count || 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {allTypes.map((type) => {
          const filteredHeatmap = getFilteredHeatmap(type);
          const filteredStats = getStatsForType(type);

          return (
            <TabsContent key={type} value={type} className="space-y-4 mt-4">
              {/* Activity Heatmap */}
              <Panel title="Activity Heatmap">
                <div className="grid grid-cols-10 gap-1">
                  {filteredHeatmap.map(({ date, duration_min, workouts }, i) => {
                    const max = Math.max(1, ...filteredHeatmap.map((d) => d.duration_min));
                    const bg = duration_min === 0 ? "bg-neutral-700" : "bg-emerald-500";
                    const opacity = duration_min === 0 ? 1 : Math.max(0.2, Math.min(1, duration_min / max));

                    return (
                      <div
                        key={`${date}-${i}`}
                        className="relative h-4 w-4 rounded-sm group cursor-pointer"
                      >
                        <div
                          className={`absolute inset-0 rounded-sm ${bg}`}
                          style={{ opacity }}
                        />

                        {duration_min > 0 && workouts.length > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                            <div className="bg-white text-black text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-xl border border-gray-200">
                              <div className="font-semibold">{date}</div>
                              <div className="text-black">
                                {workouts.map(w =>
                                  `${w.duration_min} min ${w.type.charAt(0).toUpperCase() + w.type.slice(1)}`
                                ).join(', ')}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                <div className="border-4 border-transparent border-t-white"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>

              {/* Workout Stats KPIs */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                {filteredStats.map((stat) => {
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
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
