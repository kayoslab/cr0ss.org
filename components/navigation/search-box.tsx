'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { AlgoliaHit, SearchAPIResponse } from '@/lib/algolia/client';
import { SearchResult } from '@/components/search/search-result';

interface SearchBoxProps {
  /**
   * `collapsible`: an icon button that expands into the input (desktop bar);
   * `inline`: the input is always visible (mobile menu).
   */
  variant: 'collapsible' | 'inline';
  inputId: string;
  /** Called after a navigation so a containing menu can close. */
  onNavigate?: () => void;
}

/**
 * Search-as-you-type against /api/algolia/search with keyboard navigation.
 * The only interactive island in the site header besides the mobile menu.
 */
export function SearchBox({ variant, inputId, onNavigate }: SearchBoxProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(variant === 'inline');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AlgoliaHit[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [queryID, setQueryID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length === 0) return;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/algolia/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error('Search failed');
        const data: SearchAPIResponse = await response.json();
        setSuggestions(data.hits);
        setQueryID(data.queryID);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError('Search temporarily unavailable');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // "/" focuses the desktop search from anywhere on the page.
  useEffect(() => {
    if (variant !== 'collapsible') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault();
        setExpanded(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [variant]);

  const finish = () => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (variant === 'collapsible') setExpanded(false);
    onNavigate?.();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/blog/search?q=${encodeURIComponent(q)}`);
    finish();
  };

  const choose = async (hit: AlgoliaHit) => {
    if (queryID) {
      try {
        await fetch(`/api/algolia/search?objectID=${hit.objectID}`);
      } catch (err) {
        console.error('Error tracking click:', err);
      }
    }
    router.push(hit.url);
    finish();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => (i > -1 ? i - 1 : i));
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          choose(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const status = isLoading
    ? 'Searching...'
    : error
      ? `Search error: ${error}`
      : showSuggestions && suggestions.length > 0
        ? `Found ${suggestions.length} result${suggestions.length === 1 ? '' : 's'}`
        : showSuggestions && query
          ? 'No results found'
          : '';

  return (
    <div className='relative flex items-center'>
      {variant === 'collapsible' && !expanded && (
        <button
          type='button'
          onClick={() => {
            setExpanded(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className='p-2 text-gray-500 transition-colors hover:text-gray-700'
          aria-label='Open search'
        >
          <MagnifyingGlassIcon className='h-5 w-5' />
        </button>
      )}

      <div
        className={
          variant === 'collapsible'
            ? `relative transition-all duration-200 ${expanded ? 'w-64' : 'invisible w-0'}`
            : 'relative w-full'
        }
      >
        <form onSubmit={submit} className='flex items-center'>
          <div className='relative w-full'>
            <input
              ref={inputRef}
              id={inputId}
              type='text'
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setSuggestions([]);
                  setError(null);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions(false);
                  if (variant === 'collapsible' && !query) setExpanded(false);
                }, 200);
              }}
              onKeyDown={onKeyDown}
              placeholder='Search...'
              className='w-full rounded-md border border-gray-300 py-1.5 pr-10 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden'
              aria-label='Search blog posts'
            />
            <button
              type='submit'
              className='absolute top-1/2 right-2 -translate-y-1/2'
              aria-label='Search'
            >
              <MagnifyingGlassIcon className='h-4 w-4 text-gray-500' />
            </button>
          </div>
        </form>

        <div
          role='status'
          aria-live='polite'
          aria-atomic='true'
          className='sr-only'
        >
          {status}
        </div>

        {showSuggestions && (
          <div className='absolute top-full right-0 left-0 z-100 mt-2 rounded-md border border-gray-200 bg-white shadow-lg'>
            {isLoading ? (
              <div className='px-4 py-2 text-sm text-gray-500'>Loading...</div>
            ) : error ? (
              <div className='px-4 py-2 text-sm text-red-500'>{error}</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((hit, index) => (
                <SearchResult
                  key={hit.objectID}
                  hit={hit}
                  onClick={choose}
                  isSelected={index === selectedIndex}
                />
              ))
            ) : (
              <div className='px-4 py-2 text-sm text-gray-500'>
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
