import { useState, useEffect } from 'react';
import type { AlgoliaHit, SearchAPIResponse } from '@/lib/algolia/client';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fetched, setFetched] = useState<{ suggestions: AlgoliaHit[]; queryID: string | null }>({
    suggestions: [],
    queryID: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/algolia/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        const data: SearchAPIResponse = await response.json();
        setFetched({ suggestions: data.hits, queryID: data.queryID });
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setFetched({ suggestions: [], queryID: null });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const isEmpty = searchQuery.trim().length === 0;
  return {
    searchQuery,
    setSearchQuery,
    suggestions: isEmpty ? [] : fetched.suggestions,
    queryID: isEmpty ? null : fetched.queryID,
    isLoading,
  };
}
