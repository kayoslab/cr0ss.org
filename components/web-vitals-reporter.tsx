'use client';

import { useEffect } from 'react';
import type {
  CLSMetricWithAttribution,
  FCPMetricWithAttribution,
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
  TTFBMetricWithAttribution,
} from 'web-vitals/attribution';

type Metric =
  | CLSMetricWithAttribution
  | FCPMetricWithAttribution
  | INPMetricWithAttribution
  | LCPMetricWithAttribution
  | TTFBMetricWithAttribution;

/** The parts of each metric's attribution that explain a slow value. */
function attributionOf(metric: Metric): Record<string, string | number> {
  const round = (n: number) => Math.round(n);
  switch (metric.name) {
    case 'TTFB': {
      const a = metric.attribution;
      return {
        waitingDuration: round(a.waitingDuration),
        cacheDuration: round(a.cacheDuration),
        dnsDuration: round(a.dnsDuration),
        connectionDuration: round(a.connectionDuration),
        requestDuration: round(a.requestDuration),
      };
    }
    case 'FCP': {
      const a = metric.attribution;
      return {
        timeToFirstByte: round(a.timeToFirstByte),
        firstByteToFCP: round(a.firstByteToFCP),
        loadState: a.loadState,
      };
    }
    case 'LCP': {
      const a = metric.attribution;
      return {
        target: a.target ?? '',
        url: a.url ?? '',
        timeToFirstByte: round(a.timeToFirstByte),
        resourceLoadDelay: round(a.resourceLoadDelay),
        resourceLoadDuration: round(a.resourceLoadDuration),
        elementRenderDelay: round(a.elementRenderDelay),
      };
    }
    case 'INP': {
      const a = metric.attribution;
      const script = a.longestScript?.entry;
      return {
        target: a.interactionTarget ?? '',
        type: a.interactionType ?? '',
        inputDelay: round(a.inputDelay),
        processingDuration: round(a.processingDuration),
        presentationDelay: round(a.presentationDelay),
        loadState: a.loadState,
        ...(script && {
          scriptSource: script.sourceURL,
          scriptInvoker: script.invoker,
          scriptDuration: round(script.duration),
        }),
      };
    }
    case 'CLS': {
      const a = metric.attribution;
      return {
        target: a.largestShiftTarget ?? '',
        largestShiftValue: a.largestShiftValue ?? 0,
        loadState: a.loadState ?? '',
      };
    }
  }
}

function send(metric: Metric) {
  if (metric.rating === 'good') return;

  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; rtt?: number; downlink?: number };
    deviceMemory?: number;
  };
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    path: location.pathname,
    attribution: attributionOf(metric),
    effectiveType: nav.connection?.effectiveType,
    rtt: nav.connection?.rtt,
    downlink: nav.connection?.downlink,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
  });

  // sendBeacon survives the page being hidden or unloaded, which is when
  // LCP, CLS and INP are finalised.
  const blob = new Blob([body], { type: 'application/json' });
  if (!navigator.sendBeacon?.('/api/vitals', blob)) {
    fetch('/api/vitals', { method: 'POST', body, keepalive: true }).catch(
      () => {}
    );
  }
}

/**
 * Reports slow Core Web Vitals with their attribution to /api/vitals, to
 * explain what Speed Insights only scores. The library is imported after
 * hydration so it stays off the critical path; its observers read buffered
 * entries, so nothing that happened before is missed.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    import('web-vitals/attribution').then(
      ({ onTTFB, onFCP, onLCP, onINP, onCLS }) => {
        onTTFB(send);
        onFCP(send);
        onLCP(send);
        onINP(send);
        onCLS(send);
      }
    );
  }, []);

  return null;
}
