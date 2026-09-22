import React from 'react';
import {
  getWorkoutsSummary,
  getWorkoutsHeatmap,
  getRunningStats,
} from '@/lib/dashboard/workouts';
import WorkoutsClient from './workouts.client';

export const metadata = {
  title: 'Workouts | Dashboard',
  description: 'Tracked workouts and running activity',
};

export default async function WorkoutsPage() {
  const [summary, heatmap, runningStats] = await Promise.all([
    getWorkoutsSummary('month'),
    getWorkoutsHeatmap(60, undefined),
    getRunningStats('month'),
  ]);

  // Every type ever logged; counts come from the heatmap so they match the visible window.
  const workoutTypes = summary.workout_types.map((wt) => wt.type);
  const workoutStats = workoutTypes.map((type) => {
    const typeWorkouts = heatmap.heatmap.flatMap((day) =>
      day.workouts.filter((w) => w.type === type)
    );
    return {
      workout_type: type,
      count: typeWorkouts.length,
      total_duration_min: typeWorkouts.reduce(
        (sum, w) => sum + w.duration_min,
        0
      ),
      total_distance_km: 0,
    };
  });

  const personalRecords = {
    longestRun: {
      distance_km: runningStats.personal_records.longest_run_km,
      date: runningStats.personal_records.longest_run_date,
    },
    fastestPace: {
      pace_min_per_km:
        runningStats.personal_records.fastest_pace_sec_per_km / 60,
      date: runningStats.personal_records.fastest_pace_date,
    },
  };

  return (
    <div className='w-full space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Workouts</h2>
        <p className='text-muted-foreground'>
          Tracked workout sessions, training progress, and personal records.
        </p>
      </div>

      <WorkoutsClient
        workoutTypes={workoutTypes}
        workoutStats={workoutStats}
        workoutHeatmap={heatmap.heatmap}
        currentStreak={summary.streaks.current}
        longestStreak={summary.streaks.longest}
        personalRecords={personalRecords}
      />
    </div>
  );
}
