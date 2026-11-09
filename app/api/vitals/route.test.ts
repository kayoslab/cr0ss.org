import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/rate/limit', () => ({ rateLimit: vi.fn() }));
vi.mock('@/lib/rate/who', () => ({ getClientId: () => 'test-client' }));

import { rateLimit } from '@/lib/rate/limit';
import { POST } from './route';

const report = {
  name: 'LCP',
  value: 4210,
  rating: 'poor',
  navigationType: 'navigate',
  path: '/blog',
  attribution: {
    target: 'main>img',
    timeToFirstByte: 1480,
    resourceLoadDelay: 20,
    resourceLoadDuration: 2400,
    elementRenderDelay: 310,
  },
  effectiveType: '4g',
  rtt: 350,
};

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request('http://localhost:3000/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  );

describe('POST /api/vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  it('logs the report with country and edge region', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await post(report, {
      'x-vercel-ip-country': 'US',
      'x-vercel-ip-country-region': 'CA',
      'x-vercel-id': 'sfo1::fra1::abc-123',
    });

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(warn.mock.calls[0][0] as string)).toEqual({
      msg: 'web_vital',
      ...report,
      country: 'US',
      region: 'CA',
      edge: 'sfo1',
    });
  });

  it('rejects good ratings, which the reporter never sends', async () => {
    const response = await post({ ...report, rating: 'good' });
    expect(response.status).toBe(400);
  });

  it('rejects unknown metrics', async () => {
    const response = await post({ ...report, name: 'FID' });
    expect(response.status).toBe(400);
  });

  it('rejects oversized attribution', async () => {
    const attribution = Object.fromEntries(
      Array.from({ length: 21 }, (_, i) => [`k${i}`, i])
    );
    const response = await post({ ...report, attribution });
    expect(response.status).toBe(400);
  });

  it('is rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 30 });
    const response = await post(report);
    expect(response.status).toBe(429);
  });
});
