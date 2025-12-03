"use client";

import React from "react";
import MapClient, { TravelCountry } from "@/components/map.client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Donut, Panel } from "@/components/dashboard/charts/shadcn-charts";

type TravelClientProps = {
  totalCountries: number;
  visitedCount: number;
  recentVisited: { id: string; name: string }[];
  countries: TravelCountry[];
  lat: number;
  lon: number;
  hasLocation: boolean;
};

export default function TravelClient({
  totalCountries,
  visitedCount,
  recentVisited,
  countries,
  lat,
  lon,
  hasLocation,
}: TravelClientProps) {
  return (
    <div className="space-y-6">
      {/* Map */}
      <div className="rounded-xl border border-neutral-200/60 shadow-sm">
        <div className="p-2 sm:p-3 md:p-4">
          <MapClient
            lat={lat}
            lon={lon}
            countries={countries}
            showLocation={hasLocation}
            className="block w-full h-auto"
          />
        </div>
      </div>

      {/* Travel Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visited Countries</CardDescription>
            <CardTitle className="text-4xl">{visitedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {Math.round((visitedCount / totalCountries) * 100)}% of world
            </p>
          </CardContent>
        </Card>

        <Panel title="Last Visited">
          {recentVisited.length ? (
            <div className="space-y-1">
              {recentVisited.map((c) => (
                <div key={c.id} className="text-m">
                  {c.name} ({c.id})
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">No data yet.</div>
          )}
        </Panel>

        <Donut
          title="Countries"
          data={[
            { name: "Visited", value: visitedCount },
            { name: "Not Visited", value: Math.max(0, totalCountries - visitedCount) },
          ]}
        />
      </div>
    </div>
  );
}
