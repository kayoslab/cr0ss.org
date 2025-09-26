import React from "react";
import clsx from "clsx";

/**
 * Section with a sticky subheader and proper a11y wiring:
 * - <section aria-labelledby={...}> links to the <h2 id="...">
 * - Explicit sticky background to avoid artifacts.
 * - `min-w-0` so sticky works inside grids.
 */
export default function Section({
  title,
  id,
  className,
  children,
  stickyOffset = "top-16",
}: {
  title: string;
  id: string; // require id so we can build a stable heading id
  className?: string;
  children: React.ReactNode;
  stickyOffset?: `top-${number}` | `top-[${string}]` | string;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={clsx("relative min-w-0", className)}
    >
      {/* Sticky header */}
      <div className={clsx("sticky z-30", stickyOffset, "bg-white dark:bg-slate-800")}>
        <h2
          id={headingId}
          className="py-2 text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/70 dark:border-neutral-700/60"
        >
          {title}
        </h2>
      </div>

      {/* Body */}
      <div className="mt-4">{children}</div>
    </section>
  );
}
