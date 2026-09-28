import { NextResponse } from 'next/server';
import { z } from 'zod';
import { aa } from '@/lib/algolia/client';
import { createApiRoute, validateRequestBody } from '@/lib/api/middleware';
import { RATE_LIMITS } from '@/lib/rate/config';
import { env } from '@/env';

const eventSchema = z.object({
  objectID: z.string().min(1).max(200),
  eventType: z.enum(['view', 'click', 'recommendation_click']).default('view'),
  userToken: z.string().min(1).max(128).optional(),
});

/**
 * Public beacon for Algolia Insights (views and clicks feed Recommend).
 *
 * The user token travels with each event rather than via `setUserToken`:
 * the insights client is a module singleton, and under Fluid Compute one
 * instance serves concurrent requests, so a global token would bleed
 * between visitors.
 */
export const POST = createApiRoute()
  .withRateLimit('algolia-analytics', RATE_LIMITS.ANALYTICS)
  .withTrace('POST /api/algolia/analytics')
  .handle(async (request) => {
    const body = await validateRequestBody(request, eventSchema);
    if (!body.success) return body.response;

    const { objectID, eventType, userToken } = body.data;
    const event = {
      index: env.ALGOLIA_INDEX,
      objectIDs: [objectID],
      userToken,
    };

    switch (eventType) {
      case 'click':
        aa('clickedObjectIDs', { ...event, eventName: 'Blog Clicked' });
        break;
      case 'recommendation_click':
        aa('clickedObjectIDs', {
          ...event,
          eventName: 'Recommendation Clicked',
        });
        break;
      case 'view':
        aa('viewedObjectIDs', { ...event, eventName: 'Blog Viewed' });
        break;
    }

    return NextResponse.json({ success: true });
  });
