// app/dashboard/Dashboard.skeleton.tsx
"use client";

import React from "react";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

// Small helper that mimics your Section header styling
function Header({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky z-30 top-16 bg-white dark:bg-slate-800">
      <h2 className="py-2 text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/70 dark:border-neutral-700/60">
        {children}
      </h2>
    </div>
  );
}

/**
 * Lightweight visual placeholders while the client dashboard hydrates.
 * Avoids importing server-only components (e.g., Section) to keep it bulletproof.
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* 1) Travel */}
      <section aria-busy="true" aria-live="polite">
        <Header>1. Travel</Header>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <SkeletonCard>
              <Skeleton className="h-[220px] w-full md:h-[320px]" />
            </SkeletonCard>
          </div>

          <SkeletonCard>
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-8 w-20" />
          </SkeletonCard>

          <SkeletonCard>
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </SkeletonCard>

          <SkeletonCard>
            <Skeleton className="h-6 w-28 mb-3" />
            <div className="mx-auto h-40 w-40 rounded-full overflow-hidden">
              <Skeleton className="h-full w-full" />
            </div>
          </SkeletonCard>
        </div>
      </section>

      {/* 2) Morning Brew */}
      <section aria-busy="true">
        <Header>2. Morning Brew</Header>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard>
            <Skeleton className="h-6 w-28 mb-3" />
            <Skeleton className="h-10 w-24" />
          </SkeletonCard>

          <SkeletonCard>
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-40 w-full" />
          </SkeletonCard>

          <SkeletonCard>
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="mx-auto h-40 w-40 rounded-full overflow-hidden">
              <Skeleton className="h-full w-full" />
            </div>
          </SkeletonCard>
        </div>

        <div className="mt-4">
          <SkeletonCard>
            <Skeleton className="h-6 w-64 mb-3" />
            <Skeleton className="h-48 w-full" />
          </SkeletonCard>
        </div>
      </section>

      {/* 3) Daily Rituals */}
      <section aria-busy="true">
        <Header>3. Daily Rituals</Header>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-full" />
            </SkeletonCard>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard>
            <Skeleton className="h-6 w-44 mb-3" />
            <Skeleton className="h-40 w-full" />
          </SkeletonCard>
          <div className="md:col-span-2">
            <SkeletonCard>
              <Skeleton className="h-6 w-56 mb-3" />
              <Skeleton className="h-48 w-full" />
            </SkeletonCard>
          </div>
        </div>
      </section>

      {/* 4) Focus & Flow */}
      <section aria-busy="true">
        <Header>4. Focus &amp; Flow</Header>
        <div className="mt-4">
          <SkeletonCard>
            <Skeleton className="h-6 w-72 mb-3" />
            <Skeleton className="h-56 w-full" />
          </SkeletonCard>
        </div>
      </section>

      {/* 5) Running & Movement */}
      <section aria-busy="true">
        <Header>5. Running &amp; Movement</Header>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i}>
              <Skeleton className="h-6 w-36 mb-3" />
              <Skeleton className="h-10 w-24" />
            </SkeletonCard>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard>
            <Skeleton className="h-6 w-48 mb-3" />
            <Skeleton className="h-3.5 w-full mb-2" />
            <Skeleton className="h-3.5 w-full" />
          </SkeletonCard>
          <div className="md:col-span-2">
            <SkeletonCard>
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-48 w-full" />
            </SkeletonCard>
          </div>
        </div>

        <div className="mt-4">
          <SkeletonCard>
            <Skeleton className="h-6 w-56 mb-3" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-sm" />
              ))}
            </div>
          </SkeletonCard>
        </div>
      </section>
    </div>
  );
}
