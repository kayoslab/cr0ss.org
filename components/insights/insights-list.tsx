/**
 * Insights List Component
 *
 * Fetches and displays all discovered correlations with filtering and sorting.
 */

import { CorrelationCard } from "./correlation-card";
import { dashboardApi } from "@/lib/api/client";
import type { InsightsResponse } from "@/lib/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lightbulb } from "lucide-react";

interface InsightsListProps {
  days?: number;
  pValueThreshold?: number;
  minAbsR?: number;
}

export async function InsightsList({
  days = 90,
  pValueThreshold = 0.1,
  minAbsR = 0.3,
}: InsightsListProps) {
  let correlations;
  let error = null;

  try {
    const data = await dashboardApi.get<InsightsResponse>("/insights", {
      params: {
        days,
        p_value_threshold: pValueThreshold,
        min_abs_r: minAbsR,
      },
      tags: ["insights:correlations"],
      revalidate: 900, // 15 minutes
    });
    correlations = data.correlations;
  } catch (err) {
    console.error("Error loading insights:", err);
    error = err;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Insights</AlertTitle>
        <AlertDescription>
          Failed to analyze your data. Please try again later.
          {process.env.NODE_ENV === "development" && error instanceof Error && (
            <p className="mt-2 text-xs font-mono">{error.message}</p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!correlations || correlations.length === 0) {
    return (
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>No Correlations Found</AlertTitle>
        <AlertDescription>
          We couldn&apos;t find any statistically significant correlations in your data yet.
          This could mean:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>You need more data points (at least 10 days with values for each metric)</li>
            <li>Your metrics don&apos;t have strong linear relationships</li>
            <li>Try adjusting the filters to see weaker correlations</li>
          </ul>
          <p className="mt-2">
            Keep tracking your metrics and check back later!
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Discovered Patterns
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({correlations.length} {correlations.length === 1 ? "correlation" : "correlations"})
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {correlations.map((correlation, index) => (
          <CorrelationCard
            key={`${correlation.metricA.key}-${correlation.metricB.key}-${index}`}
            correlation={correlation}
          />
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground pt-4">
        Analyzed {days} days of data • Minimum correlation strength: {minAbsR}
      </div>
    </div>
  );
}
