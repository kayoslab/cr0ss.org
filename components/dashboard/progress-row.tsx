/**
 * ProgressRow Component
 *
 * Reusable component for displaying goal progress with a progress bar.
 * Consolidates the progress row pattern used in goals sections.
 */

import { Progress } from "@/components/ui/progress";

interface ProgressRowProps {
  /**
   * Name/label of the goal (e.g., "Steps", "Reading Minutes")
   */
  name: string;

  /**
   * Current value achieved
   */
  value: number;

  /**
   * Target goal value
   */
  target: number;

  /**
   * Optional unit label (e.g., "steps", "minutes", "km")
   */
  unit?: string;

  /**
   * Optional: show percentage in addition to value/target
   */
  showPercentage?: boolean;
}

/**
 * ProgressRow - Displays a single goal with progress bar
 *
 * @example
 * ```tsx
 * <ProgressRow
 *   name="Steps"
 *   value={8500}
 *   target={10000}
 *   unit="steps"
 * />
 * ```
 */
export function ProgressRow({
  name,
  value,
  target,
  unit = "",
  showPercentage = false,
}: ProgressRowProps) {
  const percentage = target > 0 ? (value / target) * 100 : 0;
  const displayValue = value.toLocaleString();
  const displayTarget = target.toLocaleString();

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium">{name}</span>
        <span className="text-neutral-500">
          {displayValue} / {displayTarget} {unit}
          {showPercentage && ` (${Math.round(percentage)}%)`}
        </span>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-2" />
    </div>
  );
}
