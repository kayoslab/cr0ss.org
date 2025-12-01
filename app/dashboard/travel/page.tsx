import React from "react";
import { kv } from "@vercel/kv";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import DashboardClient from "../dashboard.client";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Travel | Dashboard",
  description: "Track your travel and visited countries",
};

export default async function TravelPage() {
  // live location (KV)
  const storedLocation = await kv.get<{ lat: number; lon: number }>("GEOLOCATION");
  const lat = storedLocation?.lat ?? 0;
  const lon = storedLocation?.lon ?? 0;
  const hasLocation = storedLocation != null;

  // Contentful
  const [countries = [], visited = []] = await Promise.all([getAllCountries(), getVisitedCountries(true)]);
  const countriesSlim = (countries as unknown as CountryProps[]).map((c: CountryProps) => ({
    id: c.id,
    path: c.data?.path ?? "",
    visited: c.lastVisited != null,
  }));

  const travel = {
    totalCountries: countries.length,
    visitedCount: visited.length,
    recentVisited: (visited as unknown as CountryProps[]).slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
    countries: countriesSlim,
    lat,
    lon,
    hasLocation,
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Travel</h2>
        <p className="text-muted-foreground">
          Track your travel and countries visited around the world.
        </p>
      </div>

      <DashboardClient
        travel={travel}
        morning={null}
        rituals={null}
        running={null}
        workouts={null}
        sleepPrevCaff={[]}
      />
    </div>
  );
}
