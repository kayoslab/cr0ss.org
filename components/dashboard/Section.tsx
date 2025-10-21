import React from "react";

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
    <section
      id={id}
      aria-labelledby={headingId}
      aria-label={!id ? title : undefined}
      className={className}
    >
      <h2
        id={headingId}
        className="mb-4 text-base font-semibold text-neutral-700 dark:text-neutral-200"
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
