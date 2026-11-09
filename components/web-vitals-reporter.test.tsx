import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

type Callback = (metric: unknown) => void;
const callbacks: Record<string, Callback> = {};

vi.mock('web-vitals/attribution', () => ({
  onTTFB: (cb: Callback) => (callbacks.TTFB = cb),
  onFCP: (cb: Callback) => (callbacks.FCP = cb),
  onLCP: (cb: Callback) => (callbacks.LCP = cb),
  onINP: (cb: Callback) => (callbacks.INP = cb),
  onCLS: (cb: Callback) => (callbacks.CLS = cb),
}));

import { WebVitalsReporter } from './web-vitals-reporter';

const ttfb = (rating: string) => ({
  name: 'TTFB',
  value: 1480.4,
  rating,
  navigationType: 'navigate',
  attribution: {
    waitingDuration: 10.2,
    cacheDuration: 0,
    dnsDuration: 300.6,
    connectionDuration: 700,
    requestDuration: 469.6,
  },
});

describe('WebVitalsReporter', () => {
  let sendBeacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeacon,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not send good values', async () => {
    render(<WebVitalsReporter />);
    await waitFor(() => expect(callbacks.TTFB).toBeDefined());

    callbacks.TTFB(ttfb('good'));

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('beacons a slow value with its rounded attribution', async () => {
    render(<WebVitalsReporter />);
    await waitFor(() => expect(callbacks.TTFB).toBeDefined());

    callbacks.TTFB(ttfb('poor'));

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    expect(url).toBe('/api/vitals');
    const body = JSON.parse(await blob.text());
    expect(body).toMatchObject({
      name: 'TTFB',
      rating: 'poor',
      path: '/',
      attribution: {
        waitingDuration: 10,
        dnsDuration: 301,
        connectionDuration: 700,
        requestDuration: 470,
      },
    });
  });
});
