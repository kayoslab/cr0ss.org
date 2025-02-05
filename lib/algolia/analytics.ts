export async function trackSearch(query: string, resultsCount: number) {
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
    console.error('Failed to track search:', error);
  }
} 