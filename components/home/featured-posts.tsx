import { getFeaturedPosts } from '@/lib/blog/featured';
import { RecommendationCard } from '@/components/blog/recommendation-card';

/**
 * Trending (or recent) posts on the home page. Rendered on the server from
 * cached data, so it's part of the prerendered page: no client fetch, no
 * skeleton, no layout shift.
 */
export async function FeaturedPosts() {
  const { posts, isTrending } = await getFeaturedPosts(3);
  if (posts.length === 0) return null;

  return (
    <div className='mt-16'>
      <h2 className='mb-8 text-3xl font-bold tracking-tight text-gray-900'>
        {isTrending ? 'Trending Posts' : 'Featured Posts'}
      </h2>
      <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {posts.map((post, index) => (
          <RecommendationCard
            key={post.slug}
            recommendation={post}
            priority={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
