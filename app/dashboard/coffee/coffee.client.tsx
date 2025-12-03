"use client";

import React from "react";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from "@/components/dashboard/charts/shadcn-charts";
import { CoffeeBarInteractive } from "@/components/dashboard/charts/coffee-bar-interactive";
import { BrewMethodsRadial } from "@/components/dashboard/charts/brew-methods-radial";
import { Pie, PieChart, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type CoffeeClientProps = {
  cupsToday: number;
  methodsBar: { name: string; value: number }[];
  originsDonut: { name: string; value: number }[];
  caffeineDual: { time: string; intake_mg: number; body_mg: number }[];
  dailyCoffee30Days: { date: string; cups: number }[];
};

export default function CoffeeClient({
  cupsToday,
  methodsBar,
  originsDonut,
  caffeineDual,
  dailyCoffee30Days,
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

  // Chart colors for coffee origins
  const CHART_COLOR_VALUES = [
    "oklch(0.646 0.222 41.116)",   // chart-1: orange
    "oklch(0.6 0.118 184.704)",     // chart-2: cyan
    "oklch(0.398 0.07 227.392)",    // chart-3: blue
    "oklch(0.828 0.189 84.429)",    // chart-4: yellow
    "oklch(0.769 0.188 70.08)",     // chart-5: peach
    "oklch(0.55 0.22 330)",          // chart-6: pink
    "oklch(0.65 0.18 150)",          // chart-7: teal
    "oklch(0.7 0.15 270)",           // chart-8: purple
    "oklch(0.6 0.2 50)",             // chart-9: gold
    "oklch(0.5 0.18 200)",           // chart-10: blue
  ];

  // Add fill color to data for tooltips
  const originsDonutWithColor = originsDonut.map((item, index) => ({
    ...item,
    fill: CHART_COLOR_VALUES[index % CHART_COLOR_VALUES.length],
  }));

  // Create chart config for coffee origins
  const originsChartConfig: ChartConfig = originsDonut.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: CHART_COLOR_VALUES[index % CHART_COLOR_VALUES.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="space-y-6">
      {/* Daily Coffee - Last 30 Days */}
      <CoffeeBarInteractive data={dailyCoffee30Days} />

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
                Body caffeine level of {Math.round(maxLateCaffeine)}mg after 6 PM may affect sleep quality.
                Consider avoiding coffee after 2 PM for better rest.
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
                Daily caffeine intake of {Math.round(totalIntake)}mg exceeds the FDA recommended maximum of 400mg per day.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cups Today</CardDescription>
            <CardTitle className="text-4xl">{cupsToday}</CardTitle>
          </CardHeader>
          <CardContent>
            {cupsToday >= 5 && (
              <Badge variant="warning">High consumption</Badge>
            )}
            {cupsToday === 0 && (
              <p className="text-sm text-muted-foreground">No coffee yet today</p>
            )}
            {cupsToday > 0 && cupsToday < 5 && (
              <p className="text-sm text-muted-foreground">
                {cupsToday === 1 ? '1 cup' : `${cupsToday} cups`} consumed
              </p>
            )}
          </CardContent>
        </Card>
        <BrewMethodsRadial data={methodsBar} />
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Coffee origins (7d)</CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <ChartContainer
              config={originsChartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item) => {
                        return (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.payload.fill }}
                            />
                            <span className="text-muted-foreground">{name}</span>
                            <span className="ml-auto font-mono font-medium">{value}</span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Pie
                  data={originsDonutWithColor}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {originsDonutWithColor.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.fill}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
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
