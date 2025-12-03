"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, Bars, Area, Scatter } from "@/components/dashboard/charts/shadcn-charts";

type SleepCaffData = {
  date: string;
  sleep_score: number;
  prev_caffeine_mg: number;
  prev_day_workout: boolean;
};

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
  sleepPrevCaff: SleepCaffData[];
};

export default function HabitsClient({
  progressToday,
  consistencyBars,
  rhythmTrend,
  streaks,
  sleepPrevCaff,
}: HabitsClientProps) {
  // Check for milestone achievements
  const milestoneStreaks = streaks ? Object.entries(streaks).filter(([_, data]) =>
    data.current === 7 || data.current === 30 || data.current === 100
  ) : [];

  return (
    <div className="space-y-6">
      {/* Milestone Celebrations */}
      {milestoneStreaks.length > 0 && (
        <div className="space-y-3">
          {milestoneStreaks.map(([habit, data]) => {
            const isWeek = data.current === 7;
            const isMonth = data.current === 30;
            const is100Days = data.current === 100;

            return (
              <Alert key={habit} variant="default">
                <AlertTitle className="flex items-center gap-2">
                  {is100Days && "🎉"}
                  {isMonth && "🎊"}
                  {isWeek && "🔥"}
                  {" "}
                  {is100Days ? "Amazing! 100-Day Streak!" : isMonth ? "Fantastic! 30-Day Streak!" : "Great! Week Streak!"}
                  <Badge variant={is100Days ? "success" : isMonth ? "primary" : "default"}>
                    {habit.charAt(0).toUpperCase() + habit.slice(1)}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  {is100Days && `Maintained ${habit} habit for 100 days straight. Incredible consistency and dedication!`}
                  {isMonth && `Maintained ${habit} habit for an entire month. Outstanding work on building lasting habits!`}
                  {isWeek && `Maintained ${habit} habit for a full week. Strong start on the journey to 30 days!`}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Habit Streaks Section */}
      {streaks && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Object.entries(streaks).map(([habit, data]) => (
            <Card key={habit}>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase">{habit}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-2xl">{data.current}</CardTitle>
                  {data.current > 0 && <span className="text-xl">🔥</span>}
                  {data.current >= 7 && <Badge variant="success">Week!</Badge>}
                  {data.current >= 30 && <Badge variant="primary">Month!</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Best: {data.longest} {data.longest === 1 ? "day" : "days"}
                </p>
              </CardContent>
            </Card>
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
          />
        </div>
      </div>

      {/* Sleep Quality: Caffeine & Workout Impact */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Scatter
            title="Sleep Quality: Caffeine & Workout Impact"
            data={sleepPrevCaff.map(p => ({
              date: p.date,
              sleep_score: p.sleep_score,
              prev_caffeine_mg: p.prev_caffeine_mg,
              category: p.prev_day_workout ? "Workout day before" : "No workout day before"
            }))}
            x="prev_caffeine_mg"
            y="sleep_score"
            groupField="category"
          />
          <p className="mt-2 text-xs text-neutral-500">
            Each dot is a day — X: Estimated remaining caffeine (mg) at the end of the day before. Y: sleep score.
            Green dots: no workout day before. Purple dots: workout day before.
          </p>
        </div>
      </div>
    </div>
  );
}
