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