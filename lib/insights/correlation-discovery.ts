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
  calculatePointBiserialCorrelation,
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

      // Determine if we have a binary×continuous pair (use point-biserial)
      // or continuous×continuous pair (use Pearson)
      const aIsBoolean = metricA.unit === "boolean";
      const bIsBoolean = metricB.unit === "boolean";

      // Skip if both are boolean (no meaningful correlation)
      if (aIsBoolean && bIsBoolean) {
        continue;
      }

      // Skip obvious/trivial correlations that are directly related
      const obviousCorrelations = [
        ["totalCaffeineMg", "coffeeCount"], // Caffeine is calculated from coffee
        ["runDistanceKm", "runDurationMin"], // Distance and duration are directly related
        ["outdoorMinutes", "runDurationMin"], // Running is outdoor activity
        ["outdoorMinutes", "runDistanceKm"], // Running is outdoor activity
        ["workoutCount", "workoutDurationMin"], // Duration depends on count
        ["prevDayWorkout", "prevDayWorkoutDuration"], // Workout implies duration
        ["prevDayRunning", "prevDayRunDistance"], // Running implies distance
        // Weather-to-weather correlations (obvious environmental relationships)
        ["avgCloudiness", "sunnyDay"], // sunnyDay is calculated from cloudiness < 30%
        ["avgTempCelsius", "avgHumidity"], // Temperature and humidity are physically related
        ["avgCloudiness", "avgTempCelsius"], // Cloudiness affects temperature
        ["avgCloudiness", "avgHumidity"], // Cloudiness affects humidity
      ];

      const isObvious = obviousCorrelations.some(
        ([a, b]) =>
          (metricA.key === a && metricB.key === b) ||
          (metricA.key === b && metricB.key === a)
      );

      if (isObvious) {
        continue;
      }

      // Align data by date, handling both numeric and boolean values
      const alignedData = alignMetricsByDateFlexible(
        dailyMetrics,
        metricA.key,
        metricB.key
      );

      if (alignedData.length < minSampleSize) {
        continue; // Not enough data points
      }

      let correlation: CorrelationResult;

      // Choose correlation method based on metric types
      if (aIsBoolean || bIsBoolean) {
        // Point-biserial correlation for binary×continuous
        const binaryValues = aIsBoolean
          ? alignedData.map((d) => d.valueA as boolean)
          : alignedData.map((d) => d.valueB as boolean);
        const continuousValues = aIsBoolean
          ? alignedData.map((d) => d.valueB as number)
          : alignedData.map((d) => d.valueA as number);

        correlation = calculatePointBiserialCorrelation(
          binaryValues,
          continuousValues
        );
      } else {
        // Pearson correlation for continuous×continuous
        correlation = calculatePearsonCorrelation(
          alignedData.map((d) => d.valueA as number),
          alignedData.map((d) => d.valueB as number)
        );
      }

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
 * Legacy function for backward compatibility (numeric only)
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
 * Align two metrics by date, supporting both boolean and numeric values
 * Used for point-biserial correlation (boolean×continuous) and Pearson (continuous×continuous)
 */
function alignMetricsByDateFlexible(
  data: DailyMetrics[],
  metricA: keyof DailyMetrics,
  metricB: keyof DailyMetrics
): Array<{ date: string; valueA: number | boolean; valueB: number | boolean }> {
  const aligned: Array<{ date: string; valueA: number | boolean; valueB: number | boolean }> = [];

  for (const day of data) {
    const valA = day[metricA];
    const valB = day[metricB];

    // Skip if either value is null/undefined
    if (valA === null || valA === undefined || valB === null || valB === undefined) {
      continue;
    }

    aligned.push({
      date: day.date,
      valueA: typeof valA === "boolean" ? valA : Number(valA),
      valueB: typeof valB === "boolean" ? valB : Number(valB),
    });
  }

  return aligned;
}

/**
 * Generate human-readable interpretation of correlation
 * Ensures proper time ordering: previous day events → next day outcomes
 */
function generateInterpretation(
  metricA: MetricDefinition,
  metricB: MetricDefinition,
  correlation: CorrelationResult
): string {
  const strength = correlation.strength;
  const confidence = correlation.confidence;

  // Check if either metric is binary (boolean unit)
  const aIsBoolean = metricA.unit === "boolean";
  const bIsBoolean = metricB.unit === "boolean";

  // Check if either metric is lagged (previous day)
  const aIsLagged = metricA.key.toString().startsWith('prevDay');
  const bIsLagged = metricB.key.toString().startsWith('prevDay');

  let interpretation: string;

  if (aIsBoolean || bIsBoolean) {
    // Point-biserial interpretation (binary event × continuous metric)

    if (aIsBoolean && aIsLagged) {
      // metricA is previous day boolean, metricB is today continuous
      // Proper time order: yesterday's event → today's outcome
      const event = metricA.label.replace('Previous Day ', '');
      const direction = correlation.r > 0 ? "higher" : "lower";
      interpretation = `On days after ${event}, ${metricB.label} tends to be ${direction}.`;
    } else if (bIsBoolean && bIsLagged) {
      // metricB is previous day boolean, metricA is today continuous
      // Proper time order: yesterday's event → today's outcome
      const event = metricB.label.replace('Previous Day ', '');
      // Need to flip direction since we're describing B→A relationship
      const direction = correlation.r > 0 ? "higher" : "lower";
      interpretation = `On days after ${event}, ${metricA.label} tends to be ${direction}.`;
    } else {
      // Same-day interpretation
      const binaryMetric = aIsBoolean ? metricA : metricB;
      const continuousMetric = aIsBoolean ? metricB : metricA;
      const direction = correlation.r > 0 ? "higher" : "lower";
      interpretation = `On days when ${binaryMetric.description}, ${continuousMetric.label} tends to be ${direction}.`;
    }
  } else {
    // Pearson interpretation (continuous × continuous)

    if (aIsLagged && !bIsLagged) {
      // metricA is previous day, metricB is today
      // Proper time order: yesterday's value → today's outcome
      const event = metricA.label.replace('Previous Day ', '');
      const direction = correlation.r > 0 ? "increases" : "decreases";
      interpretation = `When ${event} goes up, next day's ${metricB.label} tends to ${direction}.`;
    } else if (bIsLagged && !aIsLagged) {
      // metricB is previous day, metricA is today
      // Proper time order: yesterday's value → today's outcome
      const event = metricB.label.replace('Previous Day ', '');
      const direction = correlation.r > 0 ? "increases" : "decreases";
      interpretation = `When ${event} goes up, next day's ${metricA.label} tends to ${direction}.`;
    } else if (aIsLagged && bIsLagged) {
      // Both are lagged - unusual but handle gracefully
      // Just describe as regular correlation
      const direction = correlation.r > 0 ? "increases" : "decreases";
      interpretation = `When ${metricA.label} goes up, ${metricB.label} tends to ${direction}.`;
    } else {
      // Neither is lagged - same-day correlation
      const direction = correlation.r > 0 ? "increases" : "decreases";
      interpretation = `When ${metricA.label} goes up, ${metricB.label} tends to ${direction}.`;
    }
  }

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
