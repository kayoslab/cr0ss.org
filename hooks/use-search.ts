import { useState, useEffect } from 'react';
import type { AlgoliaHit, SearchAPIResponse } from '@/lib/algolia/client';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AlgoliaHit[]>([]);
  const [queryID, setQueryID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/algolia/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        const data: SearchAPIResponse = await response.json();
        setSuggestions(data.hits);
        setQueryID(data.queryID);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    queryID,
    isLoading
  };
} 