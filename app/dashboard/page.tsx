import React from 'react';
import Link from 'next/link';
import { MapPin, Coffee, Activity, BookOpen, Lightbulb } from 'lucide-react';
import { getLocation } from '@/lib/dashboard/location';
import { getCountries } from '@/lib/dashboard/countries';
import { getCoffeeSummary } from '@/lib/dashboard/coffee';
import { getHabitsToday } from '@/lib/dashboard/habits';
import { getWorkoutsHeatmap } from '@/lib/dashboard/workouts';
import { getGoalsProgress } from '@/lib/dashboard/goals';
import { berlinToday } from '@/lib/dashboard/today';
import { StatCard } from '@/components/dashboard/stat-card';
import { ProgressRow } from '@/components/dashboard/progress-row';

// Rendered on demand; each data function below is cached and tagged, and the
// write endpoints revalidate the tags (see lib/cache/tags.ts).

export default async function DashboardPage() {
  const today = await berlinToday();
  const [
    locationData,
    countriesData,
    coffeeSummary,
    habitsToday,
    workoutHeatmap,
    goalsProgress,
  ] = await Promise.all([
    getLocation(),
    getCountries('visited'),
    getCoffeeSummary(today),
    getHabitsToday(today),
    getWorkoutsHeatmap(60, undefined),
    getGoalsProgress(undefined),
  ]);

  const hasLocation = locationData != null;

  // Today's snapshot KPIs
  const todaySnapshot = {
    coffeeCups: coffeeSummary.cups,
    steps: habitsToday.steps,
    activeMinutes:
      workoutHeatmap.heatmap[workoutHeatmap.heatmap.length - 1]?.duration_min ||
      0,
    countriesVisited: countriesData.visited_count,
  };

  // Top three goals per period, best progress first
  const top3 = (
    items: {
      goal: string;
      current: number;
      target: number;
      unit: string;
      progress_pct: number;
    }[] = []
  ) =>
    [...items]
      .sort((a, b) => b.progress_pct - a.progress_pct)
      .slice(0, 3)
      .map((g) => ({
        name: g.goal,
        value: g.current,
        target: g.target,
        unit: g.unit,
      }));
  const dailyGoalsList = top3(goalsProgress.daily);
  const monthlyGoalsList = top3(goalsProgress.monthly);

  return (
    <div className='w-full space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Overview</h2>
        <p className='text-muted-foreground'>
          Quantified self metrics and insights at a glance
          {hasLocation && locationData.weather_main
            ? ` · ${locationData.weather_main}`
            : ''}
        </p>
      </div>

      {/* Today's Snapshot - 4 KPIs */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <StatCard
          title='Coffee Cups'
          value={todaySnapshot.coffeeCups}
          subtitle='Today'
          icon={Coffee}
        />
        <StatCard
          title='Steps'
          value={todaySnapshot.steps.toLocaleString()}
          subtitle='Today'
          icon={Activity}
        />
        <StatCard
          title='Active Minutes'
          value={todaySnapshot.activeMinutes}
          subtitle='Today'
          icon={Activity}
        />
        <StatCard
          title='Countries'
          value={todaySnapshot.countriesVisited}
          subtitle='Visited'
          icon={MapPin}
        />
      </div>

      {/* Goals Progress - Side by Side */}
      <div className='grid gap-6 md:grid-cols-2'>
        <div className='rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm'>
          <h3 className='mb-4 text-lg font-semibold'>Daily Goals</h3>
          {dailyGoalsList.length > 0 ? (
            <div className='space-y-4'>
              {dailyGoalsList.map((goal) => (
                <ProgressRow
                  key={goal.name}
                  name={goal.name}
                  value={goal.value}
                  target={goal.target}
                  unit={goal.unit}
                />
              ))}
            </div>
          ) : (
            <p className='text-sm text-neutral-500'>No daily goals set</p>
          )}
        </div>

        <div className='rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm'>
          <h3 className='mb-4 text-lg font-semibold'>Monthly Goals</h3>
          {monthlyGoalsList.length > 0 ? (
            <div className='space-y-4'>
              {monthlyGoalsList.map((goal) => (
                <ProgressRow
                  key={goal.name}
                  name={goal.name}
                  value={goal.value}
                  target={goal.target}
                  unit={goal.unit}
                />
              ))}
            </div>
          ) : (
            <p className='text-sm text-neutral-500'>No monthly goals set</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
        {[
          { href: '/dashboard/travel', label: 'Travel', Icon: MapPin },
          { href: '/dashboard/coffee', label: 'Coffee', Icon: Coffee },
          { href: '/dashboard/workouts', label: 'Workouts', Icon: Activity },
          { href: '/dashboard/habits', label: 'Habits', Icon: BookOpen },
          { href: '/dashboard/insights', label: 'Insights', Icon: Lightbulb },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className='flex flex-col items-center gap-2 rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm transition-colors hover:bg-neutral-50'
          >
            <Icon className='h-8 w-8 text-neutral-600' />
            <span className='font-medium'>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
