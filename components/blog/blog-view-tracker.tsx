'use client';
import { useEffect } from 'react';
import { BlogProps } from '@/lib/contentful/api/props/blog';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function BlogViewTracker({ blog }: { blog: BlogProps }) {
  useEffect(() => {
    const trackView = async (retryCount = 0) => {
      try {
        const response = await fetch('/api/algolia/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            objectID: blog.sys.id
          })
        });

        if (!response.ok && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return trackView(retryCount + 1);
        }
      } catch (error) {
        console.error('Error tracking view:', error);
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return trackView(retryCount + 1);
        }
      }
    };

    trackView();
  }, [blog.sys.id]);

  return null;
} 