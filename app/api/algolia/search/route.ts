export const runtime = "edge";

import { NextResponse } from 'next/server';
import { env } from '@/env';
import { rateLimit } from '@/lib/rate/limit';

// Algolia hit interface - Contentful nested structure
interface AlgoliaSearchHit {
  objectID: string;
  fields: {
    title: { 'en-US': string };
    summary: { 'en-US': string };
    slug: { 'en-US': string };
    author: { 'en-US': string };
    heroImage?: { 'en-US': { sys: { id: string } } };
  };
}

// Fetch asset URLs from Contentful GraphQL API
async function fetchAssetUrls(assetIds: string[]): Promise<Map<string, string>> {
  const assetMap = new Map<string, string>();
  if (assetIds.length === 0) return assetMap;

  try {
    // Build GraphQL query for multiple assets
    const assetQueries = assetIds.map((id, i) => `
      asset${i}: asset(id: "${id}") {
        sys { id }
        url
      }
    `).join('\n');

    const query = `query { ${assetQueries} }`;

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

    if (!response.ok) return assetMap;

    const data = await response.json();

    // Map asset IDs to URLs
    assetIds.forEach((id, i) => {
      const asset = data.data?.[`asset${i}`];
      if (asset?.url) {
        assetMap.set(id, asset.url);
      }
    });
  } catch {
    // Silently fail - images are optional
  }

  return assetMap;
}

// Extract asset ID from hit
function getAssetId(hit: AlgoliaSearchHit): string | undefined {
  return hit.fields.heroImage?.['en-US']?.sys?.id;
}

// Normalize hit from Contentful nested structure to flat structure
function normalizeHit(hit: AlgoliaSearchHit, assetMap: Map<string, string>) {
  const { fields } = hit;
  const assetId = getAssetId(hit);

  return {
    objectID: hit.objectID,
    title: fields.title['en-US'],
    summary: fields.summary['en-US'],
    author: fields.author['en-US'],
    url: `/blog/${fields.slug['en-US']}`,
    image: assetId ? assetMap.get(assetId) : undefined,
    // Categories are Entry links in this structure - we skip them for search suggestions
    categories: [] as string[],
  };
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

    // Collect asset IDs from hits
    const assetIds = hits
      .map(hit => getAssetId(hit))
      .filter((id): id is string => Boolean(id));

    // Fetch asset URLs from Contentful
    const assetMap = await fetchAssetUrls(assetIds);

    // Normalize hits to handle Contentful's nested structure
    const normalizedHits = hits.map(hit => normalizeHit(hit, assetMap));

    return NextResponse.json({
      hits: normalizedHits,
      queryID: data.queryID || null,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ hits: [], queryID: null }, { status: 500 });
  }
} 