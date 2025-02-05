import { algoliasearch } from 'algoliasearch';
import { env } from '@/env';
import type { SearchResponse, SearchClient } from '@algolia/client-search';
import aa from 'search-insights';

interface AlgoliaHit {
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

export async function search(query: string) {
  const { results } = await searchClient.search<AlgoliaHit>([{
    indexName: 'www',
    params: {
      query,
      hitsPerPage: 5,
      clickAnalytics: true
    }
  }]);

  const searchResponse = results[0] as SearchResponse<AlgoliaHit>;
  return {
    hits: searchResponse.hits,
    queryID: searchResponse.queryID
  };
}

export function trackClick(objectID: string) {
  aa('clickedObjectIDs', {
    eventName: 'Post Clicked',
    index: 'www',
    objectIDs: [objectID],
  });
}

export type { AlgoliaHit }; 