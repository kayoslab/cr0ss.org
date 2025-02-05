import { searchClient } from '@/lib/algolia/search/client';

export default async function SearchAnalytics() {
  const analytics = await searchClient.getSearchAnalytics({
    index: 'www',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Search Analytics</h1>
      {/* Add visualization of search analytics */}
    </div>
  );
} 