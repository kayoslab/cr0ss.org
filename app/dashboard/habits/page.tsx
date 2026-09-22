import React from 'react';
import {
  getHabitsToday,
  getHabitsConsistency,
  getHabitsStreaks,
  getHabitsTrends,
  getSleepQuality,
} from '@/lib/dashboard/habits';
import { getGoals } from '@/lib/dashboard/goals';
import { berlinToday } from '@/lib/dashboard/today';
import HabitsClient from './habits.client';

export const metadata = {
  title: 'Habits & Productivity | Dashboard',
  description: 'Tracked daily habits and productivity metrics',
};

export default async function HabitsPage() {
  const today = await berlinToday();
  const [habitsToday, consistency, streaks, trends, goals, sleepQuality] =
    await Promise.all([
      getHabitsToday(today),
      getHabitsConsistency(7),
      getHabitsStreaks(),
      getHabitsTrends('writing_minutes,focus_minutes', 14),
      getGoals(),
      getSleepQuality(),
    ]);

  const allGoals = { ...goals.monthly, ...goals.daily };

  const progressToday = [
    { name: 'Steps', value: habitsToday.steps, target: allGoals.steps || 0 },
    {
      name: 'Reading',
      value: habitsToday.reading_minutes,
      target: allGoals.reading_minutes || 0,
    },
    {
      name: 'Outdoor',
      value: habitsToday.outdoor_minutes,
      target: allGoals.outdoor_minutes || 0,
    },
    {
      name: 'Writing',
      value: habitsToday.writing_minutes,
      target: allGoals.writing_minutes || 0,
    },
    {
      name: 'Coding',
      value: habitsToday.coding_minutes,
      target: allGoals.coding_minutes || 0,
    },
  ];

  const consistencyBars = consistency.habits.map((h) => ({
    name: h.name,
    value: h.consistency_pct,
  }));

  const rhythmTrend = trends.trends.map((t) => ({
    date: t.date,
    'Writing (min)': t.values.writing_minutes || 0,
    'Focus (min)': t.values.focus_minutes || 0,
  }));

  const streak = (habit: string) =>
    streaks.streaks.find((s) => s.habit === habit) || {
      current: 0,
      longest: 0,
    };
  const streaksFormatted = {
    reading: streak('Reading'),
    outdoor: streak('Outdoors'),
    writing: streak('Writing'),
    coding: streak('Coding'),
    steps: streak('Steps'),
  };

  return (
    <div className='w-full space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>
          Habits & Productivity
        </h2>
        <p className='text-muted-foreground'>
          Tracked daily habits, productivity metrics, streaks, and consistency.
        </p>
      </div>

      <HabitsClient
        progressToday={progressToday}
        consistencyBars={consistencyBars}
        rhythmTrend={rhythmTrend}
        streaks={streaksFormatted}
        sleepPrevCaff={sleepQuality.data}
      />
    </div>
  );
}
