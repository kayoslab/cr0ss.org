export async function trackSearchQuery(query: string, resultsCount: number) {
  try {
    await fetch('/api/algolia/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'search',
        query,
        resultsCount
      })
    });
  } catch (error) {
    // Fail silently - analytics shouldn't break the app
    console.error('Failed to track search:', error);
  }
} 