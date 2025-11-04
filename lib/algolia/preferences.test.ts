import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSearchPreferences, saveSearchPreferences } from './preferences';

describe('Search Preferences', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        store = {};
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSearchPreferences', () => {
    it('should return default preferences when no data stored', () => {
      const prefs = getSearchPreferences();

      expect(prefs).toEqual({
        hitsPerPage: 5,
        sortBy: 'relevance',
        darkMode: false,
      });
    });

    it('should return default preferences on server side (no window)', () => {
      // @ts-expect-error - Testing server-side behavior
      const originalWindow = global.window;
      // @ts-expect-error - Testing server-side behavior
      delete global.window;

      const prefs = getSearchPreferences();

      expect(prefs).toEqual({
        hitsPerPage: 5,
        sortBy: 'relevance',
        darkMode: false,
      });

      // @ts-expect-error - Restoring window
      global.window = originalWindow;
    });

    it('should return stored preferences', () => {
      const stored = {
        hitsPerPage: 10,
        sortBy: 'date' as const,
        darkMode: true,
      };
      localStorage.setItem('search-preferences', JSON.stringify(stored));

      const prefs = getSearchPreferences();

      expect(prefs).toEqual(stored);
    });

    it('should return default preferences for invalid JSON', () => {
      localStorage.setItem('search-preferences', 'invalid json{');

      const prefs = getSearchPreferences();

      expect(prefs).toEqual({
        hitsPerPage: 5,
        sortBy: 'relevance',
        darkMode: false,
      });
    });

    it('should return default preferences for empty string', () => {
      localStorage.setItem('search-preferences', '');

      const prefs = getSearchPreferences();

      expect(prefs).toEqual({
        hitsPerPage: 5,
        sortBy: 'relevance',
        darkMode: false,
      });
    });

    it('should handle malformed JSON gracefully', () => {
      localStorage.setItem('search-preferences', '{"hitsPerPage": 10,}');

      const prefs = getSearchPreferences();

      expect(prefs).toEqual({
        hitsPerPage: 5,
        sortBy: 'relevance',
        darkMode: false,
      });
    });
  });

  describe('saveSearchPreferences', () => {
    it('should save full preferences', () => {
      const prefs = {
        hitsPerPage: 10,
        sortBy: 'date' as const,
        darkMode: true,
      };

      saveSearchPreferences(prefs);

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored).toEqual(prefs);
    });

    it('should merge partial preferences with defaults', () => {
      saveSearchPreferences({ hitsPerPage: 10 });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored).toEqual({
        hitsPerPage: 10,
        sortBy: 'relevance',
        darkMode: false,
      });
    });

    it('should merge partial preferences with existing', () => {
      // Save initial preferences
      saveSearchPreferences({
        hitsPerPage: 10,
        sortBy: 'date' as const,
      });

      // Update only darkMode
      saveSearchPreferences({ darkMode: true });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored).toEqual({
        hitsPerPage: 10,
        sortBy: 'date',
        darkMode: true,
      });
    });

    it('should overwrite existing preferences for same keys', () => {
      saveSearchPreferences({ hitsPerPage: 10 });
      saveSearchPreferences({ hitsPerPage: 20 });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored.hitsPerPage).toBe(20);
    });

    it('should save sortBy preference', () => {
      saveSearchPreferences({ sortBy: 'date' });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored.sortBy).toBe('date');
    });

    it('should save darkMode preference', () => {
      saveSearchPreferences({ darkMode: true });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored.darkMode).toBe(true);
    });

    it('should handle multiple updates in sequence', () => {
      saveSearchPreferences({ hitsPerPage: 10 });
      saveSearchPreferences({ sortBy: 'date' });
      saveSearchPreferences({ darkMode: true });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored).toEqual({
        hitsPerPage: 10,
        sortBy: 'date',
        darkMode: true,
      });
    });

    it('should save empty object without changing existing prefs', () => {
      saveSearchPreferences({ hitsPerPage: 10 });
      saveSearchPreferences({});

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored.hitsPerPage).toBe(10);
    });
  });

  describe('integration', () => {
    it('should save and retrieve preferences correctly', () => {
      const prefs = {
        hitsPerPage: 15,
        sortBy: 'date' as const,
        darkMode: true,
      };

      saveSearchPreferences(prefs);
      const retrieved = getSearchPreferences();

      expect(retrieved).toEqual(prefs);
    });

    it('should handle multiple save/get cycles', () => {
      saveSearchPreferences({ hitsPerPage: 5 });
      expect(getSearchPreferences().hitsPerPage).toBe(5);

      saveSearchPreferences({ hitsPerPage: 10 });
      expect(getSearchPreferences().hitsPerPage).toBe(10);

      saveSearchPreferences({ sortBy: 'date' });
      const prefs = getSearchPreferences();
      expect(prefs.hitsPerPage).toBe(10);
      expect(prefs.sortBy).toBe('date');
    });

    it('should preserve unspecified preferences', () => {
      // Set initial state
      saveSearchPreferences({
        hitsPerPage: 20,
        sortBy: 'date' as const,
        darkMode: true,
      });

      // Update only one field
      saveSearchPreferences({ hitsPerPage: 25 });

      const prefs = getSearchPreferences();
      expect(prefs).toEqual({
        hitsPerPage: 25,
        sortBy: 'date',
        darkMode: true,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero hitsPerPage', () => {
      saveSearchPreferences({ hitsPerPage: 0 });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored.hitsPerPage).toBe(0);
    });

    it('should handle negative hitsPerPage', () => {
      saveSearchPreferences({ hitsPerPage: -5 });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored.hitsPerPage).toBe(-5);
    });

    it('should handle very large hitsPerPage', () => {
      saveSearchPreferences({ hitsPerPage: 99999 });

      const stored = JSON.parse(localStorage.getItem('search-preferences')!);
      expect(stored.hitsPerPage).toBe(99999);
    });

    it('should toggle darkMode multiple times', () => {
      saveSearchPreferences({ darkMode: true });
      expect(getSearchPreferences().darkMode).toBe(true);

      saveSearchPreferences({ darkMode: false });
      expect(getSearchPreferences().darkMode).toBe(false);

      saveSearchPreferences({ darkMode: true });
      expect(getSearchPreferences().darkMode).toBe(true);
    });
  });
});
