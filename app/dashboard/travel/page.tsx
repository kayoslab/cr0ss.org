import React from "react";
import { getAllCountries, getVisitedCountries } from "@/lib/contentful/api/country";
import { CountryProps } from "@/lib/contentful/api/props/country";
import { getCurrentLocation } from "@/lib/db/location";
import TravelClient from "./travel.client";

// Use edge runtime for better performance
export const runtime = "nodejs";


// Cache configuration - revalidate every 5 minutes
// Travel data changes infrequently, so caching is beneficial
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Travel | Dashboard",
  description: "Travel history and visited countries around the world",
};

export default async function TravelPage() {
  // Get current location from database view
  const currentLocation = await getCurrentLocation();
  const lat = currentLocation?.latitude ?? 0;
  const lon = currentLocation?.longitude ?? 0;
  const hasLocation = currentLocation != null;

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
          Travel history and countries visited around the world.
        </p>
      </div>

      <TravelClient
        totalCountries={travel.totalCountries}
        visitedCount={travel.visitedCount}
        recentVisited={travel.recentVisited}
        countries={travel.countries}
        lat={travel.lat}
        lon={travel.lon}
        hasLocation={travel.hasLocation}
      />
    </div>
  );
}
