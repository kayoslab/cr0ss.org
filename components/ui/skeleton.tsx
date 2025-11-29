import React from "react";
import clsx from "clsx";

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-neutral-200/70",
        className
      )}
    />
  );
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-neutral-200/60 shadow-sm p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
