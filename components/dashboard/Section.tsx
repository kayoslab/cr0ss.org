import React from "react";
import clsx from "clsx";

/**
 * Section with a sticky subheader that plays nicely inside grids and across browsers.
 *
 * Key fixes:
 * - Explicit background on the sticky bar to avoid "see-through" artifacts.
 * - `min-w-0` on the container so grid/flex parents don't create overflow that breaks sticky.
 * - No transforms/backdrop filters (can disable sticky on Safari).
 * - Optional `stickyOffset` lets you align with your site header height.
 */
export default function Section({
  title,
  id,
  className,
  children,
  stickyOffset = "top-16", // ~64px; adjust if your navbar is taller/shorter
}: {
  title: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** Tailwind top-* class for sticky offset (e.g., "top-14", "top-20") */
  stickyOffset?: `top-${number}` | `top-[${string}]` | string;
}) {
  return (
    <section id={id} className={clsx("relative min-w-0", className)}>
      {/* Sticky header */}
      <div
        className={clsx(
          "sticky z-30",
          stickyOffset,
          // Explicit bg so the bar looks correct over content while scrolling
          "bg-white dark:bg-slate-800"
        )}
      >
        <h2 className="py-2 text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/70 dark:border-neutral-700/60">
          {title}
        </h2>
      </div>

      {/* Body */}
      <div className="mt-4">{children}</div>
    </section>
  );
}
