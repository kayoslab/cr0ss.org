'use client';

import dynamic from 'next/dynamic';
import React from 'react';

/** Skeleton to avoid layout shift while charts hydrate on the client */
function Skeleton({ height = 192 }: { height?: number }) {
  return (
    <div
      className="rounded-lg border border-neutral-800 animate-pulse"
      style={{ height }}
      aria-busy="true"
      aria-label="Loading chart"
    />
  );
}

/** Simple panel container (Tailwind, not Tremor.Card to keep SSR stable) */
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-neutral-800 p-4">{children}</div>;
}

/** Dynamic (client-only) Tremor components */
const DonutChart = dynamic(() => import("@tremor/react").then(m => m.DonutChart), {
  ssr: false,
  loading: () => <Skeleton />,
});
const LineChart = dynamic(() => import("@tremor/react").then(m => m.LineChart), {
  ssr: false,
  loading: () => <Skeleton />,
});
const AreaChart = dynamic(() => import("@tremor/react").then(m => m.AreaChart), {
  ssr: false,
  loading: () => <Skeleton />,
});
const ScatterChart = dynamic(() => import("@tremor/react").then(m => m.ScatterChart), {
  ssr: false,
  loading: () => <Skeleton />,
});
const BarList = dynamic(() => import("@tremor/react").then(m => m.BarList), {
  ssr: false,
  loading: () => <Skeleton height={160} />,
});
const ProgressBar = dynamic(() => import("@tremor/react").then(m => m.ProgressBar), {
  ssr: false,
  loading: () => <Skeleton height={20} />,
});

/** Donut: expects [{ name, value }] */
export function Donut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Panel>
      <DonutChart data={data} category="value" index="name" />
    </Panel>
  );
}

/** Line: timeseries with one or more categories */
export function Line({ data, index, categories }: { data: any[]; index: string; categories: string[] }) {
  return (
    <Panel>
      <LineChart data={data} index={index} categories={categories} yAxisWidth={42} />
    </Panel>
  );
}

export function Area({ data, index, categories }: { data: any[]; index: string; categories: string[] }) {
  return (
    <Panel>
      <AreaChart data={data} index={index} categories={categories} yAxisWidth={42} />
    </Panel>
  );
}

export function Scatter({ data, x, y, category }: { data: { [k: string]: any }[]; x: string; y: string; category: string }) {
  return (
    <Panel>
      <ScatterChart data={data} x={x} y={y} category={category} />
    </Panel>
  );
}

export function Bars({ items }: { items: { name: string; value: number }[] }) {
  return (
    <Panel>
      <BarList data={items} />
    </Panel>
  );
}

export function Progress({ value, target }: { value: number; target: number }) {
  const pct = Math.max(0, Math.min(100, target ? (value / target) * 100 : 0));
  return (
    <Panel>
      <div className="flex justify-between text-sm mb-2">
        <span>Progress</span>
        <span>
          {value.toFixed(1)} / {target.toFixed(1)}
        </span>
      </div>
      <ProgressBar value={pct} />
    </Panel>
  );
}