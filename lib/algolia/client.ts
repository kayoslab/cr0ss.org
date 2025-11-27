import { env } from '@/env';
import { algoliasearch } from 'algoliasearch';
import type { SearchClient, SearchResponse } from '@algolia/client-search';
import aa from 'search-insights';

// Common interface for Algolia hits
export interface AlgoliaHit {
  objectID: string;
  title: string;
  summary?: string;
  author?: string;
  categories: string[];
  url: string;
  image?: string;
}

// Recommendation result interface
export interface RecommendationHit {
  objectID: string;
  title: string;
  summary?: string;
  slug: string;
  url?: string;
  image?: string;
  _score?: number;
}

// Initialize the Algolia client
export const searchClient: SearchClient = algoliasearch(
  env.ALGOLIA_APP_ID,
  env.ALGOLIA_SEARCH_KEY
);

// Initialize analytics
aa('init', {
  appId: env.ALGOLIA_APP_ID,
  apiKey: env.ALGOLIA_SEARCH_KEY
});

// Common search parameters
export const DEFAULT_SEARCH_PARAMS = {
  hitsPerPage: 9,
  clickAnalytics: true,
  analytics: true
};

// Helper function for common search operations
export async function performSearch(query: string, page: number = 0, params: object = {}) {
  try {
    const { results } = await searchClient.search<AlgoliaHit>([{
      indexName: 'www',
      params: {
        query,
        page,
        ...DEFAULT_SEARCH_PARAMS,
        ...params
      }
    }]);
    return results[0];
  } catch (error) {
    console.error('Search failed:', error);
    return {
      hits: [],
      nbHits: 0,
      nbPages: 0,
      page: 0,
      processingTimeMS: 0,
      hitsPerPage: 0,
      exhaustiveNbHits: true,
      query: '',
      params: ''
    } as SearchResponse<AlgoliaHit>;
  }
}

// Track clicks
export function trackClick(objectID: string) {
  aa('clickedObjectIDs', {
    eventName: 'Post Clicked',
    index: 'www',
    objectIDs: [objectID],
  });
}

// Export analytics for use in other files
export { aa };

// Add this type to the exports
export interface SearchAPIResponse {
  hits: AlgoliaHit[];
  queryID: string | null;
}

// Contentful nested structure interface
interface ContentfulFields {
  title: { 'en-US': string };
  summary: { 'en-US': string };
  slug: { 'en-US': string };
  heroImage?: { 'en-US': { sys: { id: string } } };
}

// Parse Algolia recommendation hit into our normalized format
function parseRecommendationHit(hit: Record<string, unknown>): RecommendationHit {
  const fields = hit.fields as ContentfulFields;

  return {
    objectID: hit.objectID as string,
    title: fields.title['en-US'],
    summary: fields.summary['en-US'],
    slug: fields.slug['en-US'],
    // Image is an asset ID, not a URL - component should handle fetching
    image: fields.heroImage?.['en-US']?.sys?.id,
    _score: hit._score as number | undefined,
  };
}

// Make a single recommendation request to Algolia
async function fetchRecommendations(
  model: string,
  objectID: string,
  maxRecommendations: number,
  threshold: number = 0
): Promise<RecommendationHit[]> {
  const body = {
    requests: [
      {
        indexName: env.ALGOLIA_INDEX,
        model,
        objectID,
        threshold,
        maxRecommendations,
      },
    ],
  };

  const response = await fetch(
    `https://${env.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/recommendations`,
    {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": env.ALGOLIA_APP_ID,
        "X-Algolia-API-Key": env.ALGOLIA_SEARCH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const hits = data.results?.[0]?.hits || [];
  return hits.map(parseRecommendationHit);
}

/**
 * Get related blog post recommendations using Algolia Recommend API
 * Uses the REST API directly since algoliasearch v5 doesn't include recommend methods
 *
 * Tries multiple strategies in order:
 * 1. related-products - ML-based recommendations from user behavior
 * 2. looking-similar - Content-based similarity (fallback)
 */
export async function getRelatedPosts(
  objectID: string,
  maxRecommendations: number = 3
): Promise<RecommendationHit[]> {
  try {
    // Try related-products first (behavior-based, needs sufficient events)
    // Using low threshold (0) for new sites with limited data
    let results = await fetchRecommendations("related-products", objectID, maxRecommendations, 0);

    if (results.length >= maxRecommendations) {
      return results.slice(0, maxRecommendations);
    }

    // If we need more, try looking-similar (content-based)
    if (results.length < maxRecommendations) {
      const needed = maxRecommendations - results.length;
      const existingIds = new Set(results.map(r => r.objectID));

      const similarResults = await fetchRecommendations("looking-similar", objectID, needed + 2, 0);

      // Add unique results that we don't already have
      for (const hit of similarResults) {
        if (!existingIds.has(hit.objectID) && results.length < maxRecommendations) {
          results.push(hit);
          existingIds.add(hit.objectID);
        }
      }
    }

    return results.slice(0, maxRecommendations);
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    return [];
  }
}

/**
 * Track when a user clicks on a recommendation
 * This helps Algolia learn which recommendations are effective
 */
export function trackRecommendationClick(objectID: string, userToken?: string) {
  if (userToken) {
    aa('setUserToken', userToken);
  }

  aa('clickedObjectIDs', {
    eventName: 'Recommendation Clicked',
    index: env.ALGOLIA_INDEX,
    objectIDs: [objectID],
  });
}

/**
 * Get trending blog posts using Algolia's trending-items model
 * Shows popular content based on user interactions
 */
export async function getTrendingPosts(
  maxRecommendations: number = 3
): Promise<RecommendationHit[]> {
  try {
    const body = {
      requests: [
        {
          indexName: env.ALGOLIA_INDEX,
          model: 'trending-items',
          threshold: 0,
          maxRecommendations,
        },
      ],
    };

    const response = await fetch(
      `https://${env.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/recommendations`,
      {
        method: "POST",
        headers: {
          "X-Algolia-Application-Id": env.ALGOLIA_APP_ID,
          "X-Algolia-API-Key": env.ALGOLIA_SEARCH_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const hits = data.results?.[0]?.hits || [];
    return hits.map(parseRecommendationHit);
  } catch (error) {
    console.error("Failed to get trending posts:", error);
    return [];
  }
} 