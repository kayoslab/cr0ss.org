import React from 'react';
import { isoToBerlinDate } from '@/lib/time/berlin';
import {
  getCoffeeSummary,
  getCoffeeTimeline,
  getCaffeineCurve,
  getCoffeeOrigins,
} from '@/lib/dashboard/coffee';
import { berlinToday } from '@/lib/dashboard/today';
import CoffeeClient from './coffee.client';

export const metadata = {
  title: 'Coffee & Caffeine | Dashboard',
  description: 'Tracked coffee consumption and caffeine intake',
};

export default async function CoffeePage() {
  const today = await berlinToday();
  const thirtyDaysAgo = new Date(`${today}T00:00:00Z`);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  const [summary, timeline, caffeineCurve, origins] = await Promise.all([
    getCoffeeSummary(today),
    getCoffeeTimeline(startDate, today, 'day'),
    getCaffeineCurve(today, 60),
    getCoffeeOrigins(),
  ]);

  // Chart series in Berlin time labels
  const caffeineDual = caffeineCurve.series.map((p) => ({
    time: isoToBerlinDate(Date.parse(p.time)),
    intake_mg: p.intake_mg,
    body_mg: p.body_mg,
  }));
  const dailyCoffee30Days = timeline.timeline.map((t) => ({
    date: t.period,
    cups: t.cups_count,
  }));

  return (
    <div className='w-full space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Coffee & Caffeine</h2>
        <p className='text-muted-foreground'>
          Tracked coffee consumption, brewing methods, and caffeine levels
          throughout the day.
        </p>
      </div>

      <CoffeeClient
        cupsToday={summary.cups}
        methodsBar={summary.brewMethods.map((b) => ({
          name: b.type,
          value: b.count,
        }))}
        originsDonut={origins.origins}
        caffeineDual={caffeineDual}
        dailyCoffee30Days={dailyCoffee30Days}
      />
    </div>
  );
}
