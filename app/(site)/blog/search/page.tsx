import { BlogProps } from '@/lib/contentful/api/props/blog';
import BlogGrid from '@/components/blog/blog-grid';
import { env } from '@/env';
import { algoliasearch } from 'algoliasearch';
import type { SearchResponse } from '@algolia/client-search';
import { getBlogById } from '@/lib/contentful/api/blog';
import { Suspense } from 'react';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import { tags } from '@/lib/cache/tags';
import { normalizeQuery } from '@/lib/algolia/query';
import { globalRateLimit } from '@/lib/rate/limit';
import { RATE_LIMITS } from '@/lib/rate/config';

interface AlgoliaHit {
  objectID: string;
  title: string;
  summary?: string;
  author?: string;
  categories?: string[];
  url?: string;
  image?: string;
}

const client = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_SEARCH_KEY);

/**
 * One results page, cached remotely and shared across instances. A page
 * navigation can't carry a BotID challenge, so this cache and the daily
 * Algolia budget it shares with /api/algolia/search are its only guards:
 * only a miss spends the budget, and `null` (budget gone) is cached briefly.
 */
async function searchPosts(
  query: string,
  page: number
): Promise<{ hits: AlgoliaHit[]; nbHits: number } | null> {
  'use cache: remote';
  cacheTag(tags.content.blogPosts);

  const quota = await globalRateLimit(
    'algolia-search',
    RATE_LIMITS.SEARCH_GLOBAL
  );
  if (!quota.ok) {
    cacheLife({ revalidate: 60, expire: 120 });
    return null;
  }
  cacheLife('content');

  const { results } = await client.search<AlgoliaHit>([
    {
      indexName: 'www',
      params: {
        query,
        page: page - 1,
        hitsPerPage: POSTS_PER_PAGE,
      },
    },
  ]);
  const { hits, nbHits = 0 } = results[0] as SearchResponse<AlgoliaHit>;
  return { hits, nbHits };
}

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || '';

  if (!query) {
    return createListMetadata({
      title: 'Search | Blog',
      description: 'Search through blog articles on cr0ss.org',
      path: '/blog/search',
    });
  }

  return createListMetadata({
    title: `Search: ${query} | Blog`,
    description: `Search results for "${query}" on cr0ss.org blog`,
    path: `/blog/search?q=${encodeURIComponent(query)}`,
  });
}

export default async function SearchResults({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const query = q || '';
  const currentPage = Number(page) || 1;

  const result = await searchPosts(normalizeQuery(query), currentPage);
  if (!result) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
        <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
          <h1 className='mb-4 text-2xl font-bold'>
            Search Results for &ldquo;{query}&rdquo;
          </h1>
          <p className='text-gray-600'>
            Search is temporarily unavailable. Please try again later.
          </p>
        </div>
      </main>
    );
  }
  const { hits, nbHits } = result;

  // If no results, show a message instead of empty grid
  if (nbHits === 0) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
        <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
          <h1 className='mb-4 text-2xl font-bold'>
            Search Results for &ldquo;{query}&rdquo;
          </h1>
          <p className='text-gray-600'>
            No results found. Try different keywords or check your spelling.
          </p>
        </div>
      </main>
    );
  }

  // Fetch full blog posts from Contentful using objectID
  const posts = await Promise.all(
    hits.map(async (hit) => {
      try {
        return (await getBlogById(hit.objectID)) as unknown as BlogProps;
      } catch (error) {
        console.error(`Error fetching blog for id ${hit.objectID}:`, error);
        return null;
      }
    })
  ).then((posts) => posts.filter((post): post is BlogProps => post !== null));

  const totalPages = Math.ceil(nbHits / POSTS_PER_PAGE);

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <Suspense
        fallback={
          <div className='flex min-h-screen items-center justify-center'>
            <div className='h-32 w-32 animate-spin rounded-full border-t-2 border-b-2 border-gray-900'></div>
          </div>
        }
      >
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
