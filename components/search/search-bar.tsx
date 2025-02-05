'use client';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import type { AlgoliaHit } from '@/lib/algolia/types';
import { SearchResult } from './search-result';
import { SearchErrorBoundary } from './search-error-boundary';
import { useSearch } from '@/hooks/use-search';

export function SearchBar() {
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    queryID,
    isLoading
  } = useSearch();
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        await fetch('/api/algolia/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'search',
            query: searchQuery.trim(),
            success: suggestions.length > 0
          })
        });
      } catch (error) {
        // Fail silently - analytics shouldn't break the app
        console.error('Failed to track search:', error);
      }
      router.push(`/blog/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setShowSearchBar(false);
    }
  };

  const handleSuggestionClick = async (hit: AlgoliaHit) => {
    if (queryID) {
      try {
        await fetch(`/api/algolia/search?objectID=${hit.objectID}`);
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    }
    router.push(hit.url);
    setSearchQuery('');
    setShowSuggestions(false);
    setShowSearchBar(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => i < suggestions.length - 1 ? i + 1 : i);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => i > -1 ? i - 1 : i);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault();
        setShowSearchBar(true);
        setTimeout(() => {
          document.getElementById('search-input')?.focus();
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleSearch = () => {
    setShowSearchBar(!showSearchBar);
    if (!showSearchBar) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    }
  };

  return (
    <SearchErrorBoundary>
      <div className="relative w-64 h-full flex items-center">
        <div className="absolute right-0 h-full flex items-center">
          <button
            onClick={toggleSearch}
            aria-label="Search"
            aria-expanded={showSearchBar}
            className={`p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity duration-200
              ${showSearchBar ? 'opacity-0 absolute right-2 pointer-events-none' : 'opacity-100'}`}
          >
            <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className={`relative transition-all duration-200 ${showSearchBar ? 'w-64' : 'w-0'}`}>
            <div className={`relative w-full ${!showSearchBar ? 'invisible' : ''}`}>
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative w-full">
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSuggestions(false);
                        if (!searchQuery) setShowSearchBar(false);
                      }, 200);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search..."
                    className="w-full pl-3 pr-10 py-1.5 rounded-md text-sm dark:bg-slate-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search"
                    aria-expanded={showSuggestions}
                    aria-controls="search-suggestions"
                    aria-activedescendant={selectedIndex >= 0 ? `suggestion-${suggestions[selectedIndex].objectID}` : undefined}
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </form>

              {showSuggestions && (
                <div 
                  id="search-suggestions"
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-[100]"
                >
                  {isLoading ? (
                    <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Searching...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((hit, index) => (
                      <SearchResult
                        key={hit.objectID}
                        hit={hit}
                        onClick={handleSuggestionClick}
                        isSelected={index === selectedIndex}
                      />
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-3">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-600 rounded">ESC</kbd> to close, 
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-600 rounded ml-1">/</kbd> to search
        </div>
      </div>
    </SearchErrorBoundary>
  );
} 