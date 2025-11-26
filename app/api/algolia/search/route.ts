export const runtime = "edge";

import { NextResponse } from 'next/server';
import { env } from '@/env';
import { rateLimit } from '@/lib/rate/limit';

// Algolia hit interface - supports both flat (new) and nested (legacy) formats
interface AlgoliaSearchHit {
  objectID: string;
  // Flat format (new - from revalidate/route.ts)
  title?: string;
  summary?: string;
  author?: string;
  url?: string;
  image?: string;
  categories?: string;
  // Nested format (legacy - may still exist in index)
  fields?: {
    title?: { 'en-US': string };
    summary?: { 'en-US': string };
    slug?: { 'en-US': string };
    author?: { 'en-US': string };
    heroImage?: { 'en-US': { sys: { id: string } } };
  };
}

// Normalized hit format
interface NormalizedHit {
  objectID: string;
  title: string;
  summary: string;
  author: string;
  url: string;
  image?: string;
  categories: string[];
  slug?: string; // Keep slug for image fetching
  heroImageId?: string; // Keep for image fetching
}

// Normalize hit to expected format - handles both flat and nested structures
function normalizeHit(hit: AlgoliaSearchHit): NormalizedHit {
  // Check if it's the flat format (new)
  if (hit.title && hit.url) {
    // Extract slug from URL for image fetching if needed
    const slug = hit.url.replace(/^\/blog\//, '').replace(/\/$/, '');

    return {
      objectID: hit.objectID,
      title: hit.title,
      summary: hit.summary || '',
      author: hit.author || '',
      url: hit.url,
      image: hit.image,
      categories: hit.categories ? hit.categories.split(',').filter(Boolean) : [],
      slug: slug,
    };
  }

  // Handle nested format (legacy)
  if (hit.fields) {
    const slug = hit.fields.slug?.['en-US'] || '';
    return {
      objectID: hit.objectID,
      title: hit.fields.title?.['en-US'] || '',
      summary: hit.fields.summary?.['en-US'] || '',
      author: hit.fields.author?.['en-US'] || '',
      url: slug ? `/blog/${slug}` : '',
      image: undefined,
      categories: [],
      slug: slug,
      heroImageId: hit.fields.heroImage?.['en-US']?.sys?.id,
    };
  }

  // Fallback for unexpected format
  return {
    objectID: hit.objectID,
    title: '',
    summary: '',
    author: '',
    url: '',
    image: undefined,
    categories: [],
  };
}

// Fetch hero image URLs from Contentful for posts without images
async function fetchMissingImages(hits: NormalizedHit[]): Promise<void> {
  const hitsNeedingImages = hits.filter(hit => !hit.image && (hit.slug || hit.heroImageId));

  if (hitsNeedingImages.length === 0) return;

  try {
    // Build GraphQL query for blog posts or assets
    const queries: string[] = [];
    const hitsByIndex = new Map<number, NormalizedHit>();

    hitsNeedingImages.forEach((hit, i) => {
      hitsByIndex.set(i, hit);

      if (hit.heroImageId) {
        // Fetch by asset ID
        queries.push(`
          asset${i}: asset(id: "${hit.heroImageId}") {
            url
          }
        `);
      } else if (hit.slug) {
        // Fetch by blog post slug
        queries.push(`
          post${i}: blogPostCollection(where: { slug: "${hit.slug}" }, limit: 1) {
            items {
              heroImage {
                url
              }
            }
          }
        `);
      }
    });

    const query = `query { ${queries.join('\n')} }`;

    const response = await fetch(
      `https://graphql.contentful.com/content/v1/spaces/${env.CONTENTFUL_SPACE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CONTENTFUL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    // Map images back to hits
    hitsByIndex.forEach((hit, i) => {
      if (hit.heroImageId) {
        const asset = data.data?.[`asset${i}`];
        if (asset?.url) {
          hit.image = asset.url.startsWith('//') ? `https:${asset.url}` : asset.url;
        }
      } else if (hit.slug) {
        const post = data.data?.[`post${i}`];
        const imageUrl = post?.items?.[0]?.heroImage?.url;
        if (imageUrl) {
          hit.image = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;
        }
      }
    });
  } catch (error) {
    // Silently fail - images are optional
    console.error('Failed to fetch missing images:', error);
  }
}

export async function GET(request: Request) {
  const rl = await rateLimit(request, "algolia-search", { windowSec: 60, max: 10 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const objectID = searchParams.get('objectID');

  // Handle click tracking - use REST API for Edge compatibility
  if (objectID) {
    try {
      await fetch(
        `https://insights.algolia.io/1/events`,
        {
          method: 'POST',
          headers: {
            'X-Algolia-Application-Id': env.ALGOLIA_APP_ID,
            'X-Algolia-API-Key': env.ALGOLIA_SEARCH_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events: [{
              eventType: 'click',
              eventName: 'Post Clicked',
              index: env.ALGOLIA_INDEX,
              objectIDs: [objectID],
            }]
          }),
        }
      );
    } catch {
      // Silently fail - analytics shouldn't block response
    }
    return NextResponse.json({ success: true });
  }

  try {
    // Use Algolia REST API directly for Edge runtime compatibility
    const response = await fetch(
      `https://${env.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${env.ALGOLIA_INDEX}/query`,
      {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': env.ALGOLIA_APP_ID,
          'X-Algolia-API-Key': env.ALGOLIA_SEARCH_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          hitsPerPage: 5,
          clickAnalytics: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Algolia search failed: ${response.status}`);
    }

    const data = await response.json();
    const hits = (data.hits || []) as AlgoliaSearchHit[];

    // Normalize hits to expected format
    const normalizedHits = hits.map(hit => normalizeHit(hit));

    // Fetch missing images from Contentful
    await fetchMissingImages(normalizedHits);

    // Remove temporary fields before returning
    const cleanedHits = normalizedHits.map(({ slug, heroImageId, ...hit }) => hit);

    return NextResponse.json({
      hits: cleanedHits,
      queryID: data.queryID || null,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ hits: [], queryID: null }, { status: 500 });
  }
} 