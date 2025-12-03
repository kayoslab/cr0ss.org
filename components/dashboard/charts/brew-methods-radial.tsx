"use client"

import * as React from "react"
import { PolarGrid, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CHART_COLOR_VALUES } from "@/lib/constants/chart-colors"

type BrewMethodsRadialProps = {
  data: { name: string; value: number }[]
}

// All available brew methods from the database
const ALL_BREW_METHODS = [
  "espresso",
  "v60",
  "chemex",
  "moka",
  "aero",
  "cold_brew",
  "other"
] as const;

export function BrewMethodsRadial({ data }: BrewMethodsRadialProps) {
  // Create a complete dataset with all brew methods, filling in 0 for missing ones
  const completeData = React.useMemo(() => {
    const dataMap = new Map(data.map(item => [item.name.toLowerCase(), item.value]));
    return ALL_BREW_METHODS.map(method => ({
      name: method,
      value: dataMap.get(method) || 0,
    }));
  }, [data]);

  // Transform data for radial bar chart with individual colors
  const chartData = completeData.map((method, index) => ({
    method: method.name,
    count: method.value,
    fill: CHART_COLOR_VALUES[index % CHART_COLOR_VALUES.length],
  }))

  // Create chart config with entries for each brew method
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: "Cups",
      },
    }
    completeData.forEach((method, index) => {
      config[method.name] = {
        label: method.name,
        color: CHART_COLOR_VALUES[index % CHART_COLOR_VALUES.length],
      }
    })
    return config
  }, [completeData])

  const totalCups = React.useMemo(
    () => completeData.reduce((acc, curr) => acc + curr.value, 0),
    [completeData]
  )

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Brew Methods Today</CardTitle>
        <CardDescription>
          {totalCups} {totalCups === 1 ? 'cup' : 'cups'} brewed
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="method" />}
            />
            <PolarGrid gridType="circle" />
            <RadialBar dataKey="count" />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
