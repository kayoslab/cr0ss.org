import React from "react";
import { getDashboardData } from "@/lib/db/dashboard";
import { isoToBerlinDate } from "@/lib/time/berlin";
import CoffeeClient from "./coffee.client";

// Use edge runtime for better performance
export const runtime = "edge";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Coffee & Caffeine | Dashboard",
  description: "Track your coffee consumption and caffeine intake",
};

export default async function CoffeePage() {
  // Fetch dashboard data directly from database
  const dashboardData = await getDashboardData();

  // Map caffeine series to chart format (Berlin time labels)
  const caffeineDual = dashboardData.caffeineSeries.map((p) => ({
    time: isoToBerlinDate(Date.parse(p.timeISO)),
    intake_mg: p.intake_mg,
    body_mg: p.body_mg,
  }));

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
        cupsToday={dashboardData.cupsToday}
        methodsBar={dashboardData.brewMethodsToday.map((b) => ({
          name: b.type,
          value: b.count,
        }))}
        originsDonut={dashboardData.coffeeOriginThisWeek}
        caffeineDual={caffeineDual}
        weeklyRhythm={dashboardData.coffeeWeeklyRhythm}
      />
    </div>
  );
}
