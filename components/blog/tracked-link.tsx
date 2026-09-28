'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

/**
 * The only interactive part of a recommendation card: a link that reports the
 * click to Algolia. Keeping this island tiny lets the card itself stay a
 * server component, so its data never has to be serialized to the client.
 */
export function TrackedLink({
  objectID,
  ...props
}: ComponentProps<typeof Link> & { objectID: string }) {
  return <Link {...props} onClick={() => trackRecommendationClick(objectID)} />;
}

function getUserToken(): string {
  try {
    return localStorage.getItem('algolia_user_token') || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

async function trackRecommendationClick(objectID: string) {
  try {
    await fetch('/api/algolia/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objectID,
        eventType: 'recommendation_click',
        userToken: getUserToken(),
      }),
      keepalive: true,
    });
  } catch {
    // Analytics must never block navigation.
  }
}
