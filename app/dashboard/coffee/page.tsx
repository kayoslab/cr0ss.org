import React from "react";
import { apiGet } from "@/lib/api/client";
import { isoToBerlinDate } from "@/lib/time/berlin";
import CoffeeClient from "./coffee.client";

// Use edge runtime for better performance
export const runtime = "nodejs";


// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Coffee & Caffeine | Dashboard",
  description: "Track your coffee consumption and caffeine intake",
};

// API Response types
interface CoffeeSummaryResponse {
  date: string;
  cups: number;
  brewMethods: Array<{ type: string; count: number }>;
}

interface CoffeeTimelineResponse {
  timeline: Array<{
    period: string;
    cups_count: number;
    avg_caffeine_mg: number;
  }>;
  total_cups: number;
  avg_cups_per_day: number;
}

interface CaffeineCurveResponse {
  date: string;
  series: Array<{
    time: string;
    intake_mg: number;
    body_mg: number;
  }>;
  body_profile: {
    half_life_hours: number;
    sensitivity: number;
    bioavailability: number;
  };
}

// Coffee origin data type (from existing data module)
interface CoffeeOrigin {
  name: string;
  value: number;
}

export default async function CoffeePage() {
  // Calculate date range for timeline (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const endDate = today.toISOString().split('T')[0];
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  // Fetch coffee data from API endpoints in parallel
  const [summary, timeline, caffeineCurve] = await Promise.all([
    apiGet<CoffeeSummaryResponse>('/api/v1/dashboard/coffee/summary', {
      tags: ['coffee:summary'],
      revalidate: 60, // 1 minute cache
    }),
    apiGet<CoffeeTimelineResponse>('/api/v1/dashboard/coffee/timeline', {
      params: {
        start_date: startDate,
        end_date: endDate,
        granularity: 'day',
      },
      tags: ['coffee:timeline'],
      revalidate: 300, // 5 minutes cache
    }),
    apiGet<CaffeineCurveResponse>('/api/v1/dashboard/coffee/caffeine-curve', {
      tags: ['coffee:caffeine'],
      revalidate: 60, // 1 minute cache
    }),
  ]);

  // Map caffeine series to chart format (Berlin time labels)
  const caffeineDual = caffeineCurve.series.map((p) => ({
    time: isoToBerlinDate(Date.parse(p.time)),
    intake_mg: p.intake_mg,
    body_mg: p.body_mg,
  }));

  // Transform timeline data for the daily coffee chart
  const dailyCoffee30Days = timeline.timeline.map((t) => ({
    date: t.period,
    cups: t.cups_count,
  }));

  // Get coffee origins data (placeholder - this data comes from a different source)
  // For now, we'll use an empty array as this data isn't available via API yet
  const coffeeOriginThisWeek: CoffeeOrigin[] = [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Coffee & Caffeine</h2>
        <p className="text-muted-foreground">
          Track your coffee consumption, brewing methods, and caffeine levels
          throughout the day.
        </p>
      </div>

      <CoffeeClient
        cupsToday={summary.cups}
        methodsBar={summary.brewMethods.map((b) => ({
          name: b.type,
          value: b.count,
        }))}
        originsDonut={coffeeOriginThisWeek}
        caffeineDual={caffeineDual}
        dailyCoffee30Days={dailyCoffee30Days}
      />
    </div>
  );
}
