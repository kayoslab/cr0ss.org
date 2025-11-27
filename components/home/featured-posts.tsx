'use client';

import { useEffect, useState } from 'react';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { RecommendationCard } from '@/components/blog/recommendation-card';

function FeaturedPostsSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex h-full flex-col overflow-hidden rounded-lg shadow-lg animate-pulse">
          <div className="aspect-[4/3] w-full bg-gray-200" />
          <div className="flex-1 p-6 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="flex justify-end">
              <div className="h-10 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeaturedPosts() {
  const [posts, setPosts] = useState<BlogProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrending, setIsTrending] = useState(false);

  useEffect(() => {
    async function fetchTrendingPosts() {
      try {
        const response = await fetch('/api/featured-posts', {
          next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
          throw new Error('Failed to fetch featured posts');
        }

        const data = await response.json();
        setPosts(data.posts || []);
        setIsTrending(data.isTrending || false);
      } catch (err) {
        console.error('Error fetching featured posts:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrendingPosts();
  }, []);

  if (error) {
    // Silently fail - don't show the section if there's an error
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-16">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Featured Posts
        </h2>
        <FeaturedPostsSkeleton />
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  const heading = isTrending ? 'Trending Posts' : 'Featured Posts';

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
        {heading}
      </h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <RecommendationCard
            key={post.slug}
            recommendation={post}
          />
        ))}
      </div>
    </div>
  );
}
