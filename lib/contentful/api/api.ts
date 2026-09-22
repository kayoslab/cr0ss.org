import { cacheLife, cacheTag } from 'next/cache';
import { env } from '@/env';

/**
 * Cached Contentful GraphQL fetch. The cache key is the query text plus the
 * tags; entries live under the `content` profile and are invalidated by the
 * Contentful webhook (app/api/revalidate) through the tags passed here.
 */
export async function fetchGraphQL(query: string, tags: string[] = []) {
  'use cache';
  cacheLife('content');
  if (tags.length > 0) cacheTag(...tags);

  const response = await fetch(
    `https://graphql.contentful.com/content/v1/spaces/${env.CONTENTFUL_SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.CONTENTFUL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    }
  );
  return response.json();
}
