"use client";

import React from "react";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Kpi } from "@/components/dashboard/kpi";
import { Donut, Line, Bars } from "@/components/dashboard/charts/shadcn-charts";

type CoffeeClientProps = {
  cupsToday: number;
  methodsBar: { name: string; value: number }[];
  originsDonut: { name: string; value: number }[];
  caffeineDual: { time: string; intake_mg: number; body_mg: number }[];
};

export default function CoffeeClient({
  cupsToday,
  methodsBar,
  originsDonut,
  caffeineDual,
}: CoffeeClientProps) {
  // Check for late caffeine (after 6 PM = 18:00)
  const lateCaffeineData = caffeineDual.filter(point => {
    const hour = parseInt(point.time.split(':')[0]);
    return hour >= 18 && point.body_mg > 200;
  });

  const hasLateCaffeine = lateCaffeineData.length > 0;
  const maxLateCaffeine = hasLateCaffeine
    ? Math.max(...lateCaffeineData.map(p => p.body_mg))
    : 0;

  // Check for high daily intake
  const totalIntake = caffeineDual.reduce((sum, p) => sum + p.intake_mg, 0);
  const highIntake = totalIntake > 400; // FDA recommends max 400mg/day

  return (
    <div className="space-y-6">
      {/* Health Alerts */}
      {(hasLateCaffeine || highIntake) && (
        <div className="space-y-3">
          {hasLateCaffeine && (
            <Alert variant="warning">
              <AlertTitle className="flex items-center gap-2">
                ⚠️ High Evening Caffeine
                <Badge variant="warning">{Math.round(maxLateCaffeine)}mg</Badge>
              </AlertTitle>
              <AlertDescription>
                Your body still has {Math.round(maxLateCaffeine)}mg of caffeine after 6 PM.
                This may affect your sleep quality tonight. Consider avoiding coffee after 2 PM.
              </AlertDescription>
            </Alert>
          )}

          {highIntake && (
            <Alert variant="warning">
              <AlertTitle className="flex items-center gap-2">
                ⚠️ High Daily Caffeine Intake
                <Badge variant="warning">{Math.round(totalIntake)}mg</Badge>
              </AlertTitle>
              <AlertDescription>
                You've consumed {Math.round(totalIntake)}mg of caffeine today. The FDA recommends a maximum of 400mg per day.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Kpi label="Cups Today" value={cupsToday} />
          {cupsToday >= 5 && (
            <Badge variant="warning" className="mt-1">High consumption</Badge>
          )}
        </div>
        <Bars title="Brew methods today" items={methodsBar} />
        <Donut title="Coffee origins (7d)" data={originsDonut} />
      </div>

      {/* Caffeine Timeline */}
      <div>
        <Line
          title="Caffeine: intake vs body load (00:00–24:00)"
          data={caffeineDual}
          index="time"
          categories={["intake_mg", "body_mg"]}
          colors={["emerald", "violet"]}
        />
        <p className="mt-2 text-xs text-neutral-500">
          Intake: caffeine consumed (mg) at that time. Body: modeled remaining caffeine (mg) in body over the day.
        </p>
      </div>

      {/* Link to Collection */}
      <div className="gap-4">
        <Link
          href="/coffee"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 border border-neutral-200 rounded-lg hover:bg-neutral-200 hover:border-neutral-300 transition-all shadow-sm"
        >
          View Coffee Collection
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
