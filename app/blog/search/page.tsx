import { BlogProps } from '@/lib/contentful/api/props/blog';
import BlogGrid from '@/components/blog-grid';
import { env } from '@/env';
import { algoliasearch } from "algoliasearch";
import type { SearchResponse } from '@algolia/client-search';
import { getBlog } from '@/lib/contentful/api/blog';

interface AlgoliaHit {
  objectID: string;
  title: string;
  summary: string;
  author: string;
  categories: string[];
  url: string;  // contains the slug
  image: string;  // contains heroImage URL
}

const client = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_SEARCH_KEY);

const POSTS_PER_PAGE = 9;

export default async function SearchResults({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const currentPage = Number(searchParams.page) || 1;
  
  const { results } = await client.search<AlgoliaHit>([{
    indexName: 'www',
    params: {
      query,
      page: currentPage - 1,
      hitsPerPage: POSTS_PER_PAGE
    }
  }]);

  const { hits, nbHits = 0 } = results[0] as SearchResponse<AlgoliaHit>;

  // Extract slug from URL and fetch full blog posts from Contentful
  const posts = await Promise.all(
    hits.map(async hit => {
      // Remove leading '/blog/' and trailing '/' from URL to get slug
      const slug = hit.url.replace(/^\/blog\//, '').replace(/\/$/, '');
      if (!slug) {
        console.error('Could not extract slug from URL:', hit.url);
        return null;
      }
      try {
        return await getBlog(slug);
      } catch (error) {
        console.error(`Error fetching blog for slug ${slug}:`, error);
        return null;
      }
    })
  ).then(posts => posts.filter((post): post is BlogProps => post !== null));

  const totalPages = Math.ceil(nbHits / POSTS_PER_PAGE);

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800 pb-24'>
      <BlogGrid
        posts={posts}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/blog/search?q=${encodeURIComponent(query)}`}
        title={`Search Results for "${query}"`}
      />
    </main>
  );
} 