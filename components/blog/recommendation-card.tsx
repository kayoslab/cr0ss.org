'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';

interface RecommendationCardProps {
  recommendation: BlogProps;
}

/**
 * Get or create user token for Algolia analytics
 */
function getUserToken(): string {
  const STORAGE_KEY = 'algolia_user_token';

  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  return localStorage.getItem(STORAGE_KEY) || 'anonymous';
}

/**
 * Track recommendation click via the analytics API
 */
async function trackRecommendationClick(objectID: string) {
  try {
    const userToken = getUserToken();

    await fetch('/api/algolia/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectID,
        eventType: 'recommendation_click',
        userToken,
      }),
    });
  } catch {
    // Silently fail - analytics shouldn't block user interaction
  }
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const optimizedImageUrl = optimizeWithPreset(recommendation?.heroImage?.url, 'gridThumbnail');

  const handleClick = () => {
    trackRecommendationClick(recommendation.sys.id);
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg shadow-lg">
      <Link href={`/blog/${recommendation.slug}`} onClick={handleClick}>
        <Image
          alt={recommendation.title}
          className="aspect-4/3 w-full object-cover"
          height={263}
          src={optimizedImageUrl}
          width={350}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>
      <div className="flex-1 p-6">
        <Link href={`/blog/${recommendation.slug}`} onClick={handleClick}>
          <h3 className="py-4 text-2xl font-bold leading-tight text-zinc-900">
            {recommendation.title}
          </h3>
        </Link>
        <div className="flex justify-end">
          <Link
            className="inline-flex h-10 items-center justify-center text-sm font-medium"
            href={`/blog/${recommendation.slug}`}
            onClick={handleClick}
          >
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}
