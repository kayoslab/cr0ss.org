'use client';
import { useState, useEffect } from 'react';
import { Dialog, Popover } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import type { AlgoliaHit, SearchAPIResponse } from '@/lib/algolia/client';
import Link from 'next/link';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AlgoliaHit[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [queryID, setQueryID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length === 0) {
        setSuggestions([]);
        setSearchError(null);
        return;
      }

      try {
        setIsLoading(true);
        setSearchError(null);
        const response = await fetch(`/api/algolia/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        const data: SearchAPIResponse = await response.json();
        setSuggestions(data.hits);
        setQueryID(data.queryID);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSearchError('Search temporarily unavailable');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/blog/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
      setSearchQuery('');
      setShowSuggestions(false);
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
    setMobileMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => 
          i < suggestions.length - 1 ? i + 1 : i
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => i > -1 ? i - 1 : i);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const toggleSearch = () => {
    setShowSearchBar(!showSearchBar);
    if (!showSearchBar) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    }
  };

  return (
    <header className='bg-white dark:bg-slate-800'>
      <nav
        className='mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8'
        aria-label='Global'
      >
        <div className='flex lg:flex-1'>
          <Link href='/' className='-m-1.5 p-1.5'>
            <span className='sr-only'>cr0ss.org</span>
            cr0ss.org
          </Link>
        </div>
        <div className='flex lg:hidden'>
          <button
            type='button'
            className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-white'
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className='sr-only'>Open main menu</span>
            <Bars3Icon className='h-6 w-6' aria-hidden='true' />
          </button>
        </div>

        <Popover.Group className='hidden lg:flex lg:gap-x-12 items-center'>
          <Link href='/' className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'>
            Home
          </Link>
          <Link href='/blog' className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'>
            Blog
          </Link>
          <Link href='/dashboard' className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'>
            Dashboard
          </Link>
          <Link href='/page/about' className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'>
            About
          </Link>
          <Link href='/page/contact' className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'>
            Contact
          </Link>
        </Popover.Group>
        <div className='hidden lg:flex lg:flex-1 lg:justify-end'>
          <div className="relative w-64 h-full flex items-center">
            <div className="absolute right-0 h-full flex items-center">
              <button
                onClick={toggleSearch}
                className={`p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity duration-200
                  ${showSearchBar ? 'opacity-0 absolute right-2 pointer-events-none' : 'opacity-100'}`}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
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
                        className="w-full pl-3 pr-10 py-1.5 rounded-md text-sm dark:bg-slate-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </form>

                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-100">
                      {isLoading ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                      ) : searchError ? (
                        <div className="px-4 py-2 text-sm text-red-500 dark:text-red-400">{searchError}</div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((hit, index) => (
                          <button
                            key={hit.objectID}
                            onClick={() => handleSuggestionClick(hit)}
                            className={`block w-full text-left px-4 py-2 text-sm
                              ${index === selectedIndex
                                ? 'bg-gray-100 dark:bg-slate-600'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-600'
                              }
                              text-gray-700 dark:text-white`}
                          >
                            {hit.title}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <Dialog
        as='div'
        className='lg:hidden'
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className='fixed inset-0 z-10' />
        <Dialog.Panel className='fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white dark:bg-slate-800 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10'>
          <div className='flex items-center justify-between'>
            <Link href='/' className='-m-1.5 p-1.5'>
              <span className='sr-only'>cr0ss.org</span>
              cr0ss.org
            </Link>
            <button
              type='button'
              className='-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-white'
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className='sr-only'>Close menu</span>
              <XMarkIcon className='h-6 w-6' aria-hidden='true' />
            </button>
          </div>
          <div className='mt-6 flow-root'>
            <div className='-my-6 divide-y divide-gray-500/10'>
              <div className='space-y-2 py-6'>
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input
                      id="search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-3 pr-10 py-2 rounded-md text-sm dark:bg-slate-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </form>
                <Link
                  href='/'
                  className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-white hover:bg-gray-50'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href='/blog'
                  className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-white hover:bg-gray-50'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href='/dashboard'
                  className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-white hover:bg-gray-50'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href='/page/about'
                  className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-white hover:bg-gray-50'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href='/page/contact'
                  className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 dark:text-white hover:bg-gray-50'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
              <div className='py-6'>
                {/* <a
                  href='#'
                  className='-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50'
                >
                  Log in
                </a> */}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}