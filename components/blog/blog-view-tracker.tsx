'use client';
import { useEffect } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Generate or retrieve a persistent anonymous user token for Algolia analytics
 */
function getOrCreateUserToken(): string {
  const STORAGE_KEY = 'algolia_user_token';

  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  let token = localStorage.getItem(STORAGE_KEY);

  if (!token) {
    // Generate a random token
    token =
      'user_' +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, token);
  }

  return token;
}

/**
 * Reports a post view to Algolia. Takes only the ID: a client component's
 * props are serialized into the page payload, so passing the whole post
 * would send its rich-text body to the browser a second time.
 */
export function BlogViewTracker({ objectID }: { objectID: string }) {
  useEffect(() => {
    const trackView = async (retryCount = 0) => {
      try {
        const userToken = getOrCreateUserToken();

        const response = await fetch('/api/algolia/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            objectID,
            eventType: 'view',
            userToken,
          }),
        });

        if (!response.ok && retryCount < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return trackView(retryCount + 1);
        }
      } catch (error) {
        console.error('Error tracking view:', error);
        if (retryCount < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return trackView(retryCount + 1);
        }
      }
    };

    trackView();
  }, [objectID]);

  return null;
}
