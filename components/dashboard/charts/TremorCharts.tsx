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
    <div className={`h-full w-full rounded-lg animate-pulse bg-neutral-100/60 dark:bg-neutral-800/60 ${className}`} />
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
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700 shadow-sm p-4 h-full">
      <div className="uppercase tracking-wider text-neutral-400 text-xs mb-3">{title}</div>
      {children}
    </div>
  );
}

function Empty({ hint }: { hint?: string }) {
  return <div className="text-neutral-500 dark:text-neutral-400 text-sm">No data yet{hint ? ` — ${hint}` : ""}.</div>;
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
  data: any[];
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
                <div className="rounded-md border bg-white p-2 text-sm shadow dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-1 font-medium">{label}</div>
                  {payload.map((p: any) => {
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
  data: any[];
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
                <div className="rounded-md border bg-white p-2 text-sm shadow dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-1 font-medium">{label}</div>
                  {payload.map((p: any) => {
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
  colors = ["violet"],          // keep your default
  groupField,
  isLoading,
  showLegend = true,            // new: allow toggling
}: {
  title: string;
  data: { [k: string]: any }[];
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
    .filter(Boolean) as { [k: string]: any }[];

  // Keep your “always pass category” approach
  const category = groupField ?? "__group";
  const safe = groupField ? prepared : prepared.map((d) => ({ ...d, [category]: "all" }));

  // Derive category order from data so we can color legend & tooltip consistently
  const derivedCats = Array.from(
    new Set(safe.map((d) => d?.[category]).filter((v) => v !== undefined && v !== null))
  ).map(String);
  const base = (colors && colors.length ? colors : DEFAULT_CHART_COLORS);
  const palette = derivedCats.map((_, i) => base[i % base.length]);

  // Name -> color map for legend/tooltip swatches
  const colorMap = new Map(derivedCats.map((name, i) => [name, palette[i]]));

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
            category={category}       // unchanged
            colors={palette}          // pass our palette to Tremor
            showLegend={false}        // we render our own above
            yAxisWidth={42}
            customTooltip={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              // For Scatter, payload[0].payload is the point, payload[0].color is the rendered color (from Tremor/Recharts)
              const p0: any = payload[0] ?? {};
              const point = p0.payload ?? {};
              const groupName = String(point?.[category] ?? "");
              const swatch = (p0.color as string) || colorMap.get(groupName) || palette[0];

              return (
                <div className="rounded-md border bg-white p-2 text-sm shadow dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-1 flex items-center gap-2">
                    {derivedCats.length > 0 && (
                      <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: swatch }} />
                    )}
                    <span className="font-medium">
                      {groupField ? groupName : title}
                    </span>
                  </div>
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
export function Progress({ title, value, target, isLoading }:{
  title:string; value:number; target:number; isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Panel title={title}>
        <Skeleton className="h-7" />
      </Panel>
    );
  }
  const pct = Math.max(0, Math.min(100, target ? (value/target)*100 : 0));
  return (
    <Panel title={title}>
      {target <= 0 ? <Empty hint="target is 0"/> : (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span>{value.toFixed(1)} / {target.toFixed(1)}</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <ProgressImpl value={pct}/>
        </>
      )}
    </Panel>
  );
}
