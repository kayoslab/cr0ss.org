/**
 * Correlation Discovery Engine
 *
 * Discovers statistically significant correlations between quantified self metrics.
 * Combines data aggregation with statistical analysis to surface insights.
 */

import {
  fetchDailyMetrics,
  extractMetricValues,
  getMinimumSampleSize,
  type DailyMetrics,
  AVAILABLE_METRICS,
  type MetricDefinition,
} from "./data-aggregator";
import {
  calculatePearsonCorrelation,
  type CorrelationResult,
} from "../stats/correlation";

export interface DiscoveredCorrelation {
  metricA: MetricDefinition;
  metricB: MetricDefinition;
  correlation: CorrelationResult;
  dateRange: {
    start: string;
    end: string;
  };
  interpretation: string;
}

export interface CorrelationDiscoveryOptions {
  /**
   * Number of days to analyze (default: 90)
   */
  days?: number;

  /**
   * Minimum p-value threshold for significance (default: 0.1)
   * - 0.01: Strong (99% confidence)
   * - 0.05: Moderate (95% confidence)
   * - 0.1: Exploratory (90% confidence)
   */
  pValueThreshold?: number;

  /**
   * Minimum absolute correlation coefficient (default: 0.3)
   */
  minAbsR?: number;

  /**
   * Specific metrics to analyze (default: all available)
   */
  metricsToAnalyze?: Array<keyof DailyMetrics>;
}

/**
 * Discover all significant correlations in the dataset
 */
export async function discoverCorrelations(
  options: CorrelationDiscoveryOptions = {}
): Promise<DiscoveredCorrelation[]> {
  const {
    days = 90,
    pValueThreshold = 0.1,
    minAbsR = 0.3,
    metricsToAnalyze = AVAILABLE_METRICS.map((m) => m.key),
  } = options;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch all daily metrics
  const dailyMetrics = await fetchDailyMetrics(startDate, endDate);

  const discoveries: DiscoveredCorrelation[] = [];
  const minSampleSize = getMinimumSampleSize();

  // Test all pairwise combinations
  const metricsToTest = AVAILABLE_METRICS.filter((m) =>
    metricsToAnalyze.includes(m.key)
  );

  for (let i = 0; i < metricsToTest.length; i++) {
    for (let j = i + 1; j < metricsToTest.length; j++) {
      const metricA = metricsToTest[i];
      const metricB = metricsToTest[j];

      // Skip boolean metrics (like sunnyDay) for Pearson correlation
      if (metricA.unit === "boolean" || metricB.unit === "boolean") {
        continue;
      }

      // Skip obvious/trivial correlations that are directly related
      const obviousCorrelations = [
        ["totalCaffeineMg", "coffeeCount"], // Caffeine is calculated from coffee
        ["runDistanceKm", "runDurationMin"], // Distance and duration are directly related
        ["outdoorMinutes", "runDurationMin"], // Running is outdoor activity
        ["outdoorMinutes", "runDistanceKm"], // Running is outdoor activity
      ];

      const isObvious = obviousCorrelations.some(
        ([a, b]) =>
          (metricA.key === a && metricB.key === b) ||
          (metricA.key === b && metricB.key === a)
      );

      if (isObvious) {
        continue;
      }

      const { values: valuesA } = extractMetricValues(
        dailyMetrics,
        metricA.key
      );
      const { values: valuesB } = extractMetricValues(
        dailyMetrics,
        metricB.key
      );

      // Need matching dates for correlation
      const alignedData = alignMetricsByDate(
        dailyMetrics,
        metricA.key,
        metricB.key
      );

      if (alignedData.length < minSampleSize) {
        continue; // Not enough data points
      }

      const correlation = calculatePearsonCorrelation(
        alignedData.map((d) => d.valueA),
        alignedData.map((d) => d.valueB)
      );

      // Filter by significance and strength
      if (
        correlation.pValue <= pValueThreshold &&
        Math.abs(correlation.r) >= minAbsR
      ) {
        discoveries.push({
          metricA,
          metricB,
          correlation,
          dateRange: {
            start: startDate.toISOString().split("T")[0],
            end: endDate.toISOString().split("T")[0],
          },
          interpretation: generateInterpretation(metricA, metricB, correlation),
        });
      }
    }
  }

  // Sort by significance (p-value), then by strength (|r|)
  discoveries.sort((a, b) => {
    const pDiff = a.correlation.pValue - b.correlation.pValue;
    if (Math.abs(pDiff) > 0.001) return pDiff;
    return Math.abs(b.correlation.r) - Math.abs(a.correlation.r);
  });

  return discoveries;
}

/**
 * Align two metrics by date, keeping only days where both have values
 */
function alignMetricsByDate(
  data: DailyMetrics[],
  metricA: keyof DailyMetrics,
  metricB: keyof DailyMetrics
): Array<{ date: string; valueA: number; valueB: number }> {
  const aligned: Array<{ date: string; valueA: number; valueB: number }> = [];

  for (const day of data) {
    const valA = day[metricA];
    const valB = day[metricB];

    // Skip if either value is null/undefined or boolean
    if (
      valA === null ||
      valA === undefined ||
      valB === null ||
      valB === undefined ||
      typeof valA === "boolean" ||
      typeof valB === "boolean"
    ) {
      continue;
    }

    aligned.push({
      date: day.date,
      valueA: Number(valA),
      valueB: Number(valB),
    });
  }

  return aligned;
}

/**
 * Generate human-readable interpretation of correlation
 */
function generateInterpretation(
  metricA: MetricDefinition,
  metricB: MetricDefinition,
  correlation: CorrelationResult
): string {
  const direction = correlation.r > 0 ? "increases" : "decreases";
  const strength = correlation.strength;
  const confidence = correlation.confidence;

  let interpretation = `When ${metricA.label} goes up, ${metricB.label} tends to ${direction}.`;

  if (strength === "very strong" || strength === "strong") {
    interpretation += ` This is a ${strength} relationship.`;
  }

  if (confidence === "strong") {
    interpretation += ` High statistical confidence (p < 0.01).`;
  } else if (confidence === "moderate") {
    interpretation += ` Moderate statistical confidence (p < 0.05).`;
  } else if (confidence === "exploratory") {
    interpretation += ` Exploratory finding (p < 0.1).`;
  }

  return interpretation;
}

/**
 * Get correlation between two specific metrics
 */
export async function getCorrelationBetween(
  metricA: keyof DailyMetrics,
  metricB: keyof DailyMetrics,
  days = 90
): Promise<DiscoveredCorrelation | null> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dailyMetrics = await fetchDailyMetrics(startDate, endDate);
  const alignedData = alignMetricsByDate(dailyMetrics, metricA, metricB);

  if (alignedData.length < getMinimumSampleSize()) {
    return null; // Not enough data
  }

  const correlation = calculatePearsonCorrelation(
    alignedData.map((d) => d.valueA),
    alignedData.map((d) => d.valueB)
  );

  const metricADef = AVAILABLE_METRICS.find((m) => m.key === metricA);
  const metricBDef = AVAILABLE_METRICS.find((m) => m.key === metricB);

  if (!metricADef || !metricBDef) {
    return null;
  }

  return {
    metricA: metricADef,
    metricB: metricBDef,
    correlation,
    dateRange: {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    },
    interpretation: generateInterpretation(metricADef, metricBDef, correlation),
  };
}
