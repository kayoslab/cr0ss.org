export const runtime = "edge";

import { NextResponse } from 'next/server';
import { aa } from '@/lib/algolia/client';
import { HTTP_STATUS, HTTP_MESSAGES } from '@/lib/constants/http';

export async function POST(request: Request) {
  try {
    const { objectID, eventType, userToken } = await request.json();

    if (!objectID) {
      return NextResponse.json({ error: 'objectID is required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Set user token for personalization (important for Algolia Recommend)
    if (userToken) {
      aa('setUserToken', userToken);
    }

    // Use viewedObjectIDs for page views (important for Algolia Recommend)
    // Use clickedObjectIDs for search result clicks and recommendation clicks
    switch (eventType) {
      case 'click':
        aa('clickedObjectIDs', {
          eventName: 'Blog Clicked',
          index: 'www',
          objectIDs: [objectID],
        });
        break;

      case 'recommendation_click':
        // Track clicks on recommended posts - helps Algolia learn effective recommendations
        aa('clickedObjectIDs', {
          eventName: 'Recommendation Clicked',
          index: 'www',
          objectIDs: [objectID],
        });
        break;

      case 'view':
      default:
        // Default to view event
        aa('viewedObjectIDs', {
          eventName: 'Blog Viewed',
          index: 'www',
          objectIDs: [objectID],
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
} 