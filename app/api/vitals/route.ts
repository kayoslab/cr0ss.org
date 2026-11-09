import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { RATE_LIMITS } from '@/lib/rate/config';

const vitalSchema = z.object({
  name: z.enum(['TTFB', 'FCP', 'LCP', 'INP', 'CLS']),
  value: z.number().nonnegative(),
  rating: z.enum(['needs-improvement', 'poor']),
  navigationType: z.string().max(40),
  path: z.string().max(300),
  // The metric's attribution breakdown (see components/web-vitals-reporter).
  attribution: z
    .record(z.string().max(40), z.union([z.string().max(300), z.number()]))
    .refine((a) => Object.keys(a).length <= 20),
  // Network Information API and device hints; Chromium only.
  effectiveType: z.string().max(10).optional(),
  rtt: z.number().nonnegative().optional(),
  downlink: z.number().nonnegative().optional(),
  deviceMemory: z.number().nonnegative().optional(),
  cores: z.number().nonnegative().optional(),
});

/**
 * Beacon for slow Core Web Vitals. Speed Insights has the distribution but
 * not the why; each report carries the metric's attribution (TTFB phases,
 * LCP subparts, INP target and longest script) plus the visitor's country
 * and the edge that served them, as one structured line in the runtime
 * logs. Only "needs improvement" and "poor" values are sent.
 *
 * Logged with console.warn: production strips console.log
 * (compiler.removeConsole in next.config.mjs).
 */
export const POST = createApiRoute()
  .withRateLimit('web-vitals', RATE_LIMITS.ANALYTICS)
  .handle(async (request) => {
    const body = await validateRequestBody(request, vitalSchema);
    if (!body.success) return body.response;

    const h = request.headers;
    console.warn(
      JSON.stringify({
        msg: 'web_vital',
        ...body.data,
        country: h.get('x-vercel-ip-country') ?? undefined,
        region: h.get('x-vercel-ip-country-region') ?? undefined,
        // First segment of x-vercel-id is the edge region that took the beacon.
        edge: h.get('x-vercel-id')?.split('::')[0],
      })
    );

    return new NextResponse(null, { status: 204 });
  });
