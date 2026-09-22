/**
 * Correlation discovery across the quantified-self metrics. Expensive
 * (7+ table joins plus statistics), hence the longer cache life.
 */
import { cached } from '@/lib/cache/cached';
import { tags, CACHE_LIFE } from '@/lib/cache/tags';
import {
  discoverCorrelations,
  type DiscoveredCorrelation,
} from '@/lib/insights/correlation-discovery';

export interface Insights {
  correlations: DiscoveredCorrelation[];
  metadata: {
    days_analyzed: number;
    min_correlation: number;
    p_value_threshold: number;
  };
}

async function queryInsights(
  days: number,
  pValueThreshold: number,
  minAbsR: number
): Promise<Insights> {
  const correlations = await discoverCorrelations({
    days,
    pValueThreshold,
    minAbsR,
  });
  return {
    correlations,
    metadata: {
      days_analyzed: days,
      min_correlation: minAbsR,
      p_value_threshold: pValueThreshold,
    },
  };
}

export const getInsights = cached('dashboard-insights', queryInsights, {
  tags: (days) => [
    tags.insights.correlations(days),
    tags.insights.correlations(),
  ],
  revalidate: CACHE_LIFE.standard,
});
