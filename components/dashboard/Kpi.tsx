export function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700 shadow-sm p-4 h-full">
      <div className="uppercase tracking-wider text-neutral-400 text-xs">{label}</div>
      <div className="text-3xl font-semibold mt-2">{String(value)}</div>
    </div>
  );
}