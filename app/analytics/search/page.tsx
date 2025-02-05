import { searchClient } from '@/lib/algolia/search/client';

export default async function SearchAnalytics() {
  const index = searchClient.initIndex('www');
  const { nbHits, nbQueries, lastUpdate } = await index.search('');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Search Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Records</h2>
          <p className="text-3xl font-bold">{nbHits?.toLocaleString() ?? 0}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Searches</h2>
          <p className="text-3xl font-bold">{nbQueries?.toLocaleString() ?? 0}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Last Update</h2>
          <p className="text-sm">{new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
} 