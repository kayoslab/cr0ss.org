type SearchPreferences = {
  hitsPerPage: number;
  sortBy: 'relevance' | 'date';
  darkMode: boolean;
};

const DEFAULT_PREFERENCES: SearchPreferences = {
  hitsPerPage: 5,
  sortBy: 'relevance',
  darkMode: false,
};

export function getSearchPreferences(): SearchPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  
  const stored = localStorage.getItem('search-preferences');
  if (!stored) return DEFAULT_PREFERENCES;
  
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveSearchPreferences(prefs: Partial<SearchPreferences>) {
  const current = getSearchPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem('search-preferences', JSON.stringify(updated));
} 