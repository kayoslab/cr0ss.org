'use client';

import React from "react";
import {
  Area as RechartsArea,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line as RechartsLine,
  LineChart,
  Pie,
  PieChart,
  Scatter as RechartsScatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress as ProgressBar } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Panel wrapper using shadcn Card components */
export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {children}
      </CardContent>
    </Card>
  );
}

function Empty({ hint }: { hint?: string }) {
  return <div className="text-neutral-500 text-sm">No data yet{hint ? ` — ${hint}` : ""}.</div>;
}

/* ------------------------- Color mapping ------------------------- */
const CHART_COLORS = {
  sky: "hsl(200, 98%, 39%)",
  emerald: "hsl(160, 84%, 39%)",
  violet: "hsl(258, 90%, 66%)",
  amber: "hsl(38, 92%, 50%)",
  rose: "hsl(351, 89%, 60%)",
};

function getChartColor(colorName: string): string {
  return CHART_COLORS[colorName as keyof typeof CHART_COLORS] || colorName;
}

/* ------------------------- Donut/Pie Chart ------------------------- */
export function Donut({
  title,
  data,
  colors = ["emerald", "sky", "violet", "amber", "rose"],
  isLoading,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors?: string[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Panel title={title}>
        <div className="h-64 w-full rounded-lg animate-pulse bg-neutral-100/60" />
      </Panel>
    );
  }

  if (!data.length) {
    return (
      <Panel title={title}>
        <div className="h-64 flex items-center justify-center">
          <Empty />
        </div>
      </Panel>
    );
  }

  // Create chart config from data - shadcn handles the rest
  const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
    const colorName = colors[index % colors.length];
    acc[item.name] = {
      label: item.name,
      color: getChartColor(colorName),
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Panel title={title}>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getChartColor(colors[index % colors.length])}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </Panel>
  );
}

/* ------------------------- Line Chart ------------------------- */
export function Line({
  title,
  data,
  index,
  categories,
  colors = ["sky", "emerald", "violet", "amber", "rose"],
  isLoading,
  showLegend = true,
}: {
  title: string;
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  isLoading?: boolean;
  showLegend?: boolean;
}) {
  if (isLoading) {
    return (
      <Panel title={title}>
        <div className="h-64 w-full rounded-lg animate-pulse bg-neutral-100/60" />
      </Panel>
    );
  }

  if (!data.length) {
    return (
      <Panel title={title}>
        <div className="h-64 flex items-center justify-center">
          <Empty />
        </div>
      </Panel>
    );
  }

  // Create chart config
  const chartConfig: ChartConfig = categories.reduce((acc, category, idx) => {
    acc[category] = {
      label: category,
      color: getChartColor(colors[idx % colors.length]),
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Panel title={title}>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200" />
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            width={42}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {categories.map((category, idx) => (
            <RechartsLine
              key={category}
              type="monotone"
              dataKey={category}
              stroke={getChartColor(colors[idx % colors.length])}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </Panel>
  );
}

/* ------------------------- Area Chart ------------------------- */
export function Area({
  title,
  data,
  index,
  categories,
  colors = ["sky", "emerald", "violet", "amber", "rose"],
  isLoading,
  showLegend = true,
}: {
  title: string;
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  isLoading?: boolean;
  showLegend?: boolean;
}) {
  if (isLoading) {
    return (
      <Panel title={title}>
        <div className="h-64 w-full rounded-lg animate-pulse bg-neutral-100/60" />
      </Panel>
    );
  }

  if (!data.length) {
    return (
      <Panel title={title}>
        <div className="h-64 flex items-center justify-center">
          <Empty />
        </div>
      </Panel>
    );
  }

  // Create chart config
  const chartConfig: ChartConfig = categories.reduce((acc, category, idx) => {
    acc[category] = {
      label: category,
      color: getChartColor(colors[idx % colors.length]),
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Panel title={title}>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200" />
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            width={42}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {categories.map((category, idx) => (
            <RechartsArea
              key={category}
              type="monotone"
              dataKey={category}
              stroke={getChartColor(colors[idx % colors.length])}
              fill={getChartColor(colors[idx % colors.length])}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </Panel>
  );
}

/* ------------------------- Scatter Chart ------------------------- */
export function Scatter({
  title,
  data,
  x,
  y,
  colors = ["violet"],
  groupField,
  isLoading,
  showLegend = true,
}: {
  title: string;
  data: Record<string, string | number>[];
  x: string;
  y: string;
  colors?: string[];
  groupField?: string;
  isLoading?: boolean;
  showLegend?: boolean;
}) {
  if (isLoading) {
    return (
      <Panel title={title}>
        <div className="h-64 w-full rounded-lg animate-pulse bg-neutral-100/60" />
      </Panel>
    );
  }

  // Prepare data with numeric validation
  const prepared = data
    .map((d) => {
      const xv = Number(d[x]);
      const yv = Number(d[y]);
      if (!Number.isFinite(xv) || !Number.isFinite(yv)) return null;
      return d;
    })
    .filter(Boolean) as Record<string, string | number>[];

  if (!prepared.length) {
    return (
      <Panel title={title}>
        <div className="h-64 flex items-center justify-center">
          <Empty />
        </div>
      </Panel>
    );
  }

  // Get unique categories if groupField is provided
  const categories = groupField
    ? Array.from(new Set(prepared.map((d) => String(d[groupField]))))
    : ["all"];

  // Create chart config
  const chartConfig: ChartConfig = categories.reduce((acc, category, idx) => {
    acc[category] = {
      label: category,
      color: getChartColor(colors[idx % colors.length]),
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Panel title={title}>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200" />
          <XAxis
            dataKey={x}
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            width={42}
          />
          <YAxis
            dataKey={y}
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            width={42}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          {showLegend && categories.length > 1 && (
            <ChartLegend content={<ChartLegendContent />} />
          )}
          {groupField ? (
            // Grouped scatter - one series per category
            categories.map((category, idx) => {
              const categoryData = prepared.filter(
                (d) => String(d[groupField]) === category
              );
              return (
                <RechartsScatter
                  key={category}
                  name={category}
                  data={categoryData}
                  fill={getChartColor(colors[idx % colors.length])}
                />
              );
            })
          ) : (
            // Single scatter
            <RechartsScatter
              data={prepared}
              fill={getChartColor(colors[0])}
            />
          )}
        </ScatterChart>
      </ChartContainer>
    </Panel>
  );
}

/* ------------------------- Bar List (Horizontal Bars) ------------------------- */
export function Bars({
  title,
  items,
  isLoading,
}: {
  title: string;
  items: { name: string; value: number }[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Panel title={title}>
        <div className="min-h-28 w-full rounded-lg animate-pulse bg-neutral-100/60" />
      </Panel>
    );
  }

  if (!items.length) {
    return (
      <Panel title={title}>
        <div className="min-h-28 flex items-center justify-center">
          <Empty />
        </div>
      </Panel>
    );
  }

  // Create chart config
  const chartConfig: ChartConfig = {
    value: {
      label: "Value",
      color: getChartColor("emerald"),
    },
  };

  return (
    <Panel title={title}>
      <ChartContainer config={chartConfig} className="h-full w-full min-h-28">
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            className="text-xs"
            width={100}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill={getChartColor("emerald")} radius={4} />
        </BarChart>
      </ChartContainer>
    </Panel>
  );
}

/* ------------------------- Progress Bar ------------------------- */
export function Progress({
  title,
  value,
  target,
}: {
  title: string;
  value: number | string | null | undefined;
  target: number | string | null | undefined;
}) {
  const v = Number(value ?? 0);
  const t = Number(target ?? 0);
  const hasTarget = Number.isFinite(t) && t > 0;

  const pct = hasTarget ? Math.max(0, Math.min(100, (v / t) * 100)) : 0;

  const fmt = (n: number) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "0";

  return (
    <Panel title={title}>
      {!hasTarget ? (
        <Empty hint="target is 0 or missing" />
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {fmt(v)} / {fmt(t)}
            </span>
            <span className="text-neutral-500">{Math.round(pct)}%</span>
          </div>
          <ProgressBar value={pct} className="h-2" />
        </div>
      )}
    </Panel>
  );
}
