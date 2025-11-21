import { BlogProps } from '@/lib/contentful/api/props/blog';
import BlogGrid from '@/components/blog/blog-grid';
import { env } from '@/env';
import { algoliasearch } from "algoliasearch";
import type { SearchResponse } from '@algolia/client-search';
import { getBlog } from '@/lib/contentful/api/blog';
import { Suspense } from 'react';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

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

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || '';

  if (!query) {
    return createListMetadata({
      title: 'Search | Blog | cr0ss.mind',
      description: 'Search through blog articles on cr0ss.org',
      path: '/blog/search',
    });
  }

  return createListMetadata({
    title: `Search: ${query} | Blog | cr0ss.mind`,
    description: `Search results for "${query}" on cr0ss.org blog`,
    path: `/blog/search?q=${encodeURIComponent(query)}`,
  });
}

export default async function SearchResults({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const query = q || '';
  const currentPage = Number(page) || 1;
  
  const { results } = await client.search<AlgoliaHit>([{
    indexName: 'www',
    params: {
      query,
      page: currentPage - 1,
      hitsPerPage: POSTS_PER_PAGE
    }
  }]);

  const { hits, nbHits = 0 } = results[0] as SearchResponse<AlgoliaHit>;

  // If no results, show a message instead of empty grid
  if (nbHits === 0) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold mb-4">Search Results for &ldquo;{query}&rdquo;</h1>
          <p className="text-gray-600">
            No results found. Try different keywords or check your spelling.
          </p>
        </div>
      </main>
    );
  }

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
        return await getBlog(slug) as unknown as BlogProps;
      } catch (error) {
        console.error(`Error fetching blog for slug ${slug}:`, error);
        return null;
      }
    })
  ).then(posts => posts.filter((post): post is BlogProps => post !== null));

  const totalPages = Math.ceil(nbHits / POSTS_PER_PAGE);

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      }>
        <BlogGrid
          posts={posts}
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/blog/search?q=${encodeURIComponent(query)}`}
          title={`Search Results for \"${query}\"`}
        />
      </Suspense>
    </main>
  );
} 