export const runtime = "edge";

import { getTrendingPosts } from '@/lib/algolia/client';
import { getBlog, getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { NextResponse } from 'next/server';
import { wrapTrace } from '@/lib/obs/trace';

export const GET = wrapTrace('GET /api/featured-posts', async () => {
  try {
    // Try to get trending posts from Algolia first
    const trendingHits = await getTrendingPosts(3);

    // Fetch full blog data for trending posts
    const trendingPosts: BlogProps[] = [];

    for (const hit of trendingHits) {
      try {
        if (hit.slug) {
          const blog = await getBlog(hit.slug) as unknown as BlogProps;
          if (blog) {
            trendingPosts.push(blog);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch blog for slug ${hit.slug}:`, error);
      }
    }

    // If no trending posts (not enough analytics data), fall back to recent posts
    if (trendingPosts.length === 0) {
      console.log('No trending posts found, falling back to recent posts');
      const recentBlogs = await getAllBlogs(1, 3);
      const recentPosts = recentBlogs.items as unknown as BlogProps[];

      return NextResponse.json(
        { posts: recentPosts, isTrending: false },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    return NextResponse.json(
      { posts: trendingPosts, isTrending: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    return NextResponse.json(
      { posts: [], error: 'Failed to fetch featured posts' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
});
