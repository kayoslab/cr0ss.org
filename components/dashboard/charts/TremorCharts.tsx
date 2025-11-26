'use client';

import dynamic from "next/dynamic";
import React from "react";

const DEFAULT_CHART_COLORS = ["sky", "emerald", "violet", "amber", "rose"];

function LegendDot({ color }: { color: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full bg-${color}-500`} />;
}

function BuildCustomLegend(categories: string[], palette: string[]) {
  const items = categories.map((name, i) => ({ name, color: palette[i % palette.length] }));
  return (
    <ul data-testid="custom-legend" className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {items.map(({ name, color }) => (
        <li key={name} className="flex items-center gap-2 list-none">
          <LegendDot color={color} />
          <span className="text-sm">{name}</span>
        </li>
      ))}
    </ul>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`h-full w-full rounded-lg animate-pulse bg-neutral-100/60 ${className}`} />
  );
}

const DonutImpl   = dynamic(() => import("@tremor/react").then(m => m.DonutChart),   { ssr: false, loading: () => <Skeleton /> });
const LineImpl    = dynamic(() => import("@tremor/react").then(m => m.LineChart),    { ssr: false, loading: () => <Skeleton /> });
const AreaImpl    = dynamic(() => import("@tremor/react").then(m => m.AreaChart),    { ssr: false, loading: () => <Skeleton /> });
const ScatterImpl = dynamic(() => import("@tremor/react").then(m => m.ScatterChart), { ssr: false, loading: () => <Skeleton /> });
const BarListImpl = dynamic(() => import("@tremor/react").then(m => m.BarList),      { ssr: false, loading: () => <Skeleton /> });
const ProgressImpl= dynamic(() => import("@tremor/react").then(m => m.ProgressBar),  { ssr: false, loading: () => <Skeleton /> });

/** Panel now matches KPI shell exactly */
export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200/60 shadow-sm p-4 h-full">
      <div className="uppercase tracking-wider text-neutral-400 text-xs mb-3">{title}</div>
      {children}
    </div>
  );
}

function Empty({ hint }: { hint?: string }) {
  return <div className="text-neutral-500 text-sm">No data yet{hint ? ` — ${hint}` : ""}.</div>;
}

/* ------------------------- Donut ------------------------- */
export function Donut({
  title, data, colors = ["emerald", "sky", "violet", "amber", "rose"], isLoading,
}: { title:string; data:{ name:string; value:number }[]; colors?: string[]; isLoading?: boolean }) {
  return (
    <Panel title={title}>
      <div className="h-64">
        {isLoading ? <Skeleton /> : data.length ? (
          <DonutImpl className="h-full" data={data} index="name" category="value" colors={colors} />
        ) : <Empty/>}
      </div>
    </Panel>
  );
}

/* ------------------------- Line ------------------------- */
export function Line({
  title,
  data,
  index,
  categories,
  colors = DEFAULT_CHART_COLORS,
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
  const palette = (colors && colors.length ? colors : DEFAULT_CHART_COLORS);

  return (
    <Panel title={title}>
      {/* Legend ABOVE the chart, expands layout */}
      {showLegend && (
        <div className="mb-3">
          {BuildCustomLegend(categories, palette)}
        </div>
      )}

      <div className="h-64">
        {isLoading ? (
          <Skeleton />
        ) : data.length ? (
          <LineImpl
            className="h-full"
            data={data}
            index={index}
            categories={categories}
            colors={palette}
            yAxisWidth={42}
            showLegend={false}
            customTooltip={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-md border bg-white p-2 text-sm shadow">
                  <div className="mb-1 font-medium">{label}</div>
                  {payload.map((p: { name?: string | number; value?: string | number | (string | number)[] }) => {
                    const name = String(p.name ?? "");
                    const idx = Math.max(0, categories.indexOf(name));
                    const color = palette[idx % palette.length];
                    return (
                      <div key={name} className="flex items-center gap-2">
                        <span className={`inline-block h-3 w-3 rounded bg-${color}-500`} />
                        <span>{name}: {String(p.value)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
        ) : (
          <Empty />
        )}
      </div>
    </Panel>
  );
}

/* ------------------------- Area ------------------------- */
export function Area({
  title,
  data,
  index,
  categories,
  colors = DEFAULT_CHART_COLORS,
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
  const palette = (colors && colors.length ? colors : DEFAULT_CHART_COLORS);

  return (
    <Panel title={title}>
      {/* Legend ABOVE the chart, expands layout */}
      {showLegend && (
        <div className="mb-3">
          {BuildCustomLegend(categories, palette)}
        </div>
      )}

      <div className="h-64">
        {isLoading ? (
          <Skeleton />
        ) : data.length ? (
          <AreaImpl
            className="h-full"
            data={data}
            index={index}
            categories={categories}
            colors={palette}
            yAxisWidth={42}
            showLegend={false}  // our own legend lives above
            customTooltip={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-md border bg-white p-2 text-sm shadow">
                  <div className="mb-1 font-medium">{label}</div>
                  {payload.map((p: { name?: string | number; value?: string | number | (string | number)[] }) => {
                    const name = String(p.name ?? "");
                    const idx = Math.max(0, categories.indexOf(name));
                    const color = palette[idx % palette.length];
                    return (
                      <div key={name} className="flex items-center gap-2">
                        <span className={`inline-block h-3 w-3 rounded bg-${color}-500`} />
                        <span>{name}: {String(p.value)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
        ) : (
          <Empty />
        )}
      </div>
    </Panel>
  );
}

/* ------------------------- Scatter (single or grouped) ------------------------- */
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
  groupField?: string; // optional grouping field
  isLoading?: boolean;
  showLegend?: boolean;
}) {
  // Coerce to numeric & filter invalid (unchanged)
  const prepared = (Array.isArray(data) ? data : [])
    .map((d) => {
      const xv = Number(d[x]), yv = Number(d[y]);
      if (!Number.isFinite(xv) || !Number.isFinite(yv)) return null;
      return d;
    })
    .filter(Boolean) as Record<string, string | number>[];

  // Keep your “always pass category” approach
  const category = groupField ?? "__group";
  const safe = groupField ? prepared : prepared.map((d) => ({ ...d, [category]: "all" }));

  // Derive category order from data so we can color legend & tooltip consistently
  // Keep the order as it appears in the data (first occurrence wins)
  const derivedCats = Array.from(
    new Set(safe.map((d) => d?.[category]).filter((v) => v !== undefined && v !== null))
  ).map(String);
  const base = (colors && colors.length ? colors : DEFAULT_CHART_COLORS);
  const palette = derivedCats.map((_, i) => base[i % base.length]);

  // Name -> color map for legend/tooltip swatches
  const colorMap = new Map(derivedCats.map((name, i) => [name, palette[i]]));

  // Map Tremor color names to actual Tailwind hex values for tooltips
  const colorToHex: Record<string, string> = {
    'sky': '#0ea5e9',
    'emerald': '#10b981',
    'violet': '#8b5cf6',
    'amber': '#f59e0b',
    'rose': '#f43f5e',
  };

  // Create a map of category name to hex color for tooltips
  const categoryToHexMap = new Map(derivedCats.map((name, i) => [name, colorToHex[palette[i]] || palette[i]]));

  return (
    <Panel title={title}>
      {/* Legend ABOVE the chart (extends safe area, no overlap) */}
      {showLegend && derivedCats.length > 0 && (
        <div className="mb-3">
          {BuildCustomLegend(derivedCats, palette)}
        </div>
      )}

      <div className="h-64">
        {isLoading ? (
          <Skeleton />
        ) : safe.length ? (
          <ScatterImpl
            className="h-full"
            data={safe}
            x={x}
            y={y}
            category={category}
            colors={palette}
            showLegend={false}
            yAxisWidth={42}
            customTooltip={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              // For Scatter, payload[0].payload is the point, payload[0].color is the rendered color (from Tremor/Recharts)
              const p0 = payload[0] as { payload?: Record<string, string | number>; color?: string } | undefined;
              const point = p0?.payload ?? {};
              const groupName = String(point?.[category] ?? "");
              // Use our mapped hex color, fallback to Recharts color, then black
              const swatch = categoryToHexMap.get(groupName) || (p0?.color as string) || "#000";

              return (
                <div className="rounded-md border bg-white p-2 text-sm shadow">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: swatch }} />
                    <span className="font-medium">
                      {groupField ? groupName : title}
                    </span>
                  </div>
                  {point?.date && <div className="mb-1"><span className="opacity-70">Date:</span> {String(point.date)}</div>}
                  <div><span className="opacity-70">{x}:</span> {String(point?.[x])}</div>
                  <div><span className="opacity-70">{y}:</span> {String(point?.[y])}</div>
                </div>
              );
            }}
          />
        ) : (
          <Empty />
        )}
      </div>
    </Panel>
  );
}

/* ------------------------- BarList ------------------------- */
export function Bars({ title, items, isLoading }:{
  title:string; items:{name:string; value:number}[]; isLoading?: boolean;
}) {
  return (
    <Panel title={title}>
      <div className="min-h-28">
        {isLoading ? <Skeleton className="h-28" /> : items.length ? <BarListImpl data={items} color="emerald"/> : <Empty/>}
      </div>
    </Panel>
  );
}

/* ------------------------- Progress ------------------------- */
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

  // small formatter that doesn't crash on NaN
  const fmt = (n: number) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "0";

  return (
    <Panel title={title}>
      {!hasTarget ? (
        <Empty hint="target is 0 or missing" />
      ) : (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span>
              {fmt(v)} / {fmt(t)}
            </span>
            <span>{Math.round(pct)}%</span>
          </div>
          <ProgressImpl value={pct} />
        </>
      )}
    </Panel>
  );
}

