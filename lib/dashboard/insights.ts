/**
 * Correlation discovery across the quantified-self metrics. Expensive
 * (7+ table joins plus statistics), hence the longer cache life.
 */
import { cacheLife, cacheTag } from 'next/cache';
import { tags } from '@/lib/cache/tags';
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

export async function getInsights(
  days: number,
  pValueThreshold: number,
  minAbsR: number
): Promise<Insights> {
  'use cache';
  cacheLife('standard');
  cacheTag(tags.insights.correlations(days), tags.insights.correlations());
  return queryInsights(days, pValueThreshold, minAbsR);
}
