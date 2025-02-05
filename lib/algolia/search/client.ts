import { algoliasearch, SearchClient } from 'algoliasearch';
import { env } from '@/env';
import type { SearchResponse } from '@algolia/client-search';
import aa from 'search-insights';

export interface AlgoliaHit {
  objectID: string;
  title: string;
  url: string;
}

const searchClient = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_SEARCH_KEY) as SearchClient;

// Initialize insights
aa('init', {
  appId: env.ALGOLIA_APP_ID,
  apiKey: env.ALGOLIA_SEARCH_KEY
});

export { searchClient, aa };

export async function safeSearch<T>(query: string) {
  try {
    const { results } = await searchClient.search<T>([{
      indexName: 'www',
      params: {
        query,
        hitsPerPage: 5,
        clickAnalytics: true
      }
    }]);
    return results[0];
  } catch (error) {
    console.error('Search failed:', error);
    return { hits: [], nbHits: 0, nbPages: 0 };
  }
} 