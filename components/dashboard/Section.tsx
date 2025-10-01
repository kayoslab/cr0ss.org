import React from "react";
import clsx from "clsx";

export default function Section({
  title,
  id,
  className,
  children,
}: {
  title: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section id={id} aria-labelledby={headingId} className={clsx("relative", className)}>
      <div className="sticky top-20 z-30" style={{ background: "inherit" }}>
        <h2
          id={headingId}
          className="py-2 text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/70 dark:border-neutral-700/60"
        >
          {title}
        </h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
