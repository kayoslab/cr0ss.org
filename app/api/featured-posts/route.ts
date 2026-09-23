import { NextResponse } from 'next/server';
import { getFeaturedPosts } from '@/lib/blog/featured';
import { wrapTrace } from '@/lib/obs/trace';
import { HTTP_STATUS } from '@/lib/constants/http';

/** GET /api/featured-posts — the same trending/recent set the home page renders. */
export const GET = wrapTrace('GET /api/featured-posts', async () => {
  try {
    const { posts, isTrending } = await getFeaturedPosts(3);
    return NextResponse.json(
      { posts, isTrending },
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
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
});
