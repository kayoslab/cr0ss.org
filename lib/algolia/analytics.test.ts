import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackSearch } from './analytics';

describe('lib/algolia/analytics', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackSearch', () => {
    it('should send search analytics to API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await trackSearch('test query', 5);

      expect(mockFetch).toHaveBeenCalledWith('/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'search',
          query: 'test query',
          resultsCount: 5,
        }),
      });
    });

    it('should handle zero results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await trackSearch('nonexistent term', 0);

      expect(mockFetch).toHaveBeenCalledWith('/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'search',
          query: 'nonexistent term',
          resultsCount: 0,
        }),
      });
    });

    it('should handle empty query string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await trackSearch('', 10);

      expect(mockFetch).toHaveBeenCalledWith('/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'search',
          query: '',
          resultsCount: 10,
        }),
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await trackSearch('test query', 5);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to track search:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await trackSearch('test query', 5);

      // Should not throw, just log error (or not log if API returns error without throwing)
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should send correct Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await trackSearch('test', 1);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should use POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await trackSearch('test', 1);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('POST');
    });

    it('should properly serialize request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await trackSearch('complex "query" with special chars', 42);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body as string);

      expect(body).toEqual({
        type: 'search',
        query: 'complex "query" with special chars',
        resultsCount: 42,
      });
    });

    it('should handle very large result counts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await trackSearch('popular query', 99999);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/algolia/analytics',
        expect.objectContaining({
          body: JSON.stringify({
            type: 'search',
            query: 'popular query',
            resultsCount: 99999,
          }),
        })
      );
    });

    it('should not throw when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await expect(trackSearch('test', 1)).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
