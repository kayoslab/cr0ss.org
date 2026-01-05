import React from "react";
import { dashboardApi } from "@/lib/api/client";
import type { LocationResponse, CountriesResponse } from "@/lib/api/types";
import TravelClient from "./travel.client";

// Use edge runtime for better performance
export const runtime = "nodejs";

// Force dynamic rendering to fetch data on-demand from API
// API endpoints handle caching with tag-based invalidation
export const dynamic = 'force-dynamic';

// Cache configuration - revalidate every 5 minutes
// Travel data changes infrequently, so caching is beneficial
export const revalidate = 300; // 5 minutes

export const metadata = {
  title: "Travel | Dashboard",
  description: "Travel history and visited countries around the world",
};

export default async function TravelPage() {
  // Fetch location and countries data from APIs
  const [locationData, allCountriesData, visitedCountriesData] = await Promise.all([
    dashboardApi.get<LocationResponse>("/location", {
      tags: ["dashboard:location"],
      revalidate: 300, // 5 minutes
    }),
    dashboardApi.get<CountriesResponse>("/countries", {
      tags: ["dashboard:countries"],
      revalidate: 3600, // 1 hour
    }),
    dashboardApi.get<CountriesResponse>("/countries", {
      params: { visited: "true" },
      tags: ["dashboard:countries"],
      revalidate: 3600, // 1 hour
    }),
  ]);

  const lat = locationData?.latitude ?? 0;
  const lon = locationData?.longitude ?? 0;
  const hasLocation = locationData != null;

  const countriesSlim = allCountriesData.countries.map((c) => ({
    id: c.id,
    path: c.path,
    visited: c.visited,
  }));

  const travel = {
    totalCountries: allCountriesData.total,
    visitedCount: visitedCountriesData.visited_count,
    recentVisited: visitedCountriesData.countries.slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
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
