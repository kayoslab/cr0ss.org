import { searchClient } from '@/lib/algolia/search/client';
import type { SearchResponse } from '@algolia/client-search';
import type { AlgoliaHit } from '@/lib/algolia/types';

export default async function SearchAnalytics() {
  const { results } = await searchClient.search<AlgoliaHit>([{
    indexName: 'www',
    params: {
      query: '',
      analytics: false,
      clickAnalytics: false,
    }
  }]);

  const { nbHits = 0, nbPages = 0 } = results[0] as SearchResponse<AlgoliaHit>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Search Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Records</h2>
          <p className="text-3xl font-bold">{nbHits?.toLocaleString() ?? 0}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Pages</h2>
          <p className="text-3xl font-bold">{nbPages?.toLocaleString() ?? 0}</p>
        </div>
      </div>
    </div>
  );
} 