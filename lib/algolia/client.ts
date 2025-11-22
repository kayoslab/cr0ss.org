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
  url: string;
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

/**
 * Get related blog post recommendations using Algolia Recommend API
 * Uses the REST API directly since algoliasearch v5 doesn't include recommend methods
 */
export async function getRelatedPosts(
  objectID: string,
  maxRecommendations: number = 3
): Promise<RecommendationHit[]> {
  try {
    const body = {
      requests: [
        {
          indexName: env.ALGOLIA_INDEX,
          model: "related-products",
          objectID,
          threshold: 30,
          maxRecommendations,
          queryParameters: {
            attributesToRetrieve: ["title", "summary", "url", "image"],
          },
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
      console.error("Algolia Recommend API error:", response.status);
      return [];
    }

    const data = await response.json();
    const hits = data.results?.[0]?.hits || [];

    return hits.map((hit: Record<string, unknown>) => ({
      objectID: hit.objectID as string,
      title: hit.title as string,
      summary: hit.summary as string | undefined,
      url: hit.url as string,
      image: hit.image as string | undefined,
      _score: hit._score as number | undefined,
    }));
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    return [];
  }
} 