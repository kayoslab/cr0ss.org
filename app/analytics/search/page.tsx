import { searchClient } from '@/lib/algolia/search/client';
import { env } from '@/env';

export default async function SearchAnalytics() {
  // For now, just show basic stats from the index
  const index = searchClient.initIndex('www');
  const stats = await index.getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Search Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Records</h2>
          <p className="text-3xl font-bold">{stats.numberOfRecords.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Searches (24h)</h2>
          <p className="text-3xl font-bold">{stats.numberOfQueries.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-700 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Last Update</h2>
          <p className="text-sm">{new Date(stats.lastUpdate).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
} 