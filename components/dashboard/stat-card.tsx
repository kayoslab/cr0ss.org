/**
 * StatCard Component
 *
 * Reusable card component for displaying KPI statistics.
 * Consolidates the stat card pattern used across dashboard pages.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  /**
   * Title/label for the statistic (e.g., "Coffee Cups", "Steps")
   */
  title: string;

  /**
   * The main value to display (e.g., number or formatted string)
   */
  value: string | number;

  /**
   * Optional subtitle for additional context (e.g., "Today", "This Month")
   */
  subtitle?: string;

  /**
   * Optional icon component from lucide-react
   */
  icon?: LucideIcon;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StatCard - Displays a single KPI statistic in a card format
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Coffee Cups"
 *   value={3}
 *   subtitle="Today"
 *   icon={Coffee}
 * />
 * ```
 */
export function StatCard({ title, value, subtitle, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground mb-2" />}
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl">{value}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
