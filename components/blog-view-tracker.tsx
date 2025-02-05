'use client';
import { useEffect } from 'react';
import { BlogProps } from '@/lib/contentful/api/props/blog';

export function BlogViewTracker({ blog }: { blog: BlogProps }) {
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch('/api/algolia/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            objectID: blog.sys.id
          })
        });
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, [blog.sys.id]);

  return null;
} 