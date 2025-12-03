import React from "react";
import { getCoffeeDashboardData } from "@/lib/db/dashboard";
import { isoToBerlinDate } from "@/lib/time/berlin";
import CoffeeClient from "./coffee.client";

// Use edge runtime for better performance
export const runtime = "edge";

// Cache configuration - revalidate every 5 minutes
// Immediate invalidation on POST via revalidateDashboard()
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Coffee & Caffeine | Dashboard",
  description: "Track your coffee consumption and caffeine intake",
};

export default async function CoffeePage() {
  // Fetch coffee-specific dashboard data
  const coffeeData = await getCoffeeDashboardData();

  // Map caffeine series to chart format (Berlin time labels)
  const caffeineDual = coffeeData.caffeineSeries.map((p) => ({
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
        cupsToday={coffeeData.cupsToday}
        methodsBar={coffeeData.brewMethodsToday.map((b) => ({
          name: b.type,
          value: b.count,
        }))}
        originsDonut={coffeeData.coffeeOriginThisWeek}
        caffeineDual={caffeineDual}
        dailyCoffee30Days={coffeeData.coffeeLast30Days}
      />
    </div>
  );
}
