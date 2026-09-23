import { cacheLife, cacheTag } from 'next/cache';
import { getTrendingPosts } from '@/lib/algolia/client';
import { getBlog, getAllBlogs } from '@/lib/contentful/api/blog';
import type { BlogProps } from '@/lib/contentful/api/props/blog';
import { tags } from '@/lib/cache/tags';

export interface FeaturedPosts {
  posts: BlogProps[];
  /** True when Algolia had enough signal for trending; false for the recency fallback. */
  isTrending: boolean;
}

/**
 * Trending posts from Algolia, falling back to the most recent ones. Cached
 * with the blog content so the home page can render it in the static shell.
 */
export async function getFeaturedPosts(count = 3): Promise<FeaturedPosts> {
  'use cache';
  cacheLife('stable');
  cacheTag(tags.content.blogPosts);

  const trendingHits = await getTrendingPosts(count);
  const fetched = await Promise.all(
    trendingHits
      .filter((hit) => hit.slug)
      .map((hit) =>
        getBlog(hit.slug).catch((error) => {
          console.error(`Failed to fetch blog for slug ${hit.slug}:`, error);
          return null;
        })
      )
  );
  const trending = fetched.filter(
    (post) => post !== null
  ) as unknown as BlogProps[];

  if (trending.length > 0) return { posts: trending, isTrending: true };

  const recent = await getAllBlogs(1, count);
  return { posts: recent.items as unknown as BlogProps[], isTrending: false };
}
