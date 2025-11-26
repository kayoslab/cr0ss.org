import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/rate/limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/env', () => ({
  env: {
    ALGOLIA_APP_ID: 'test-app-id',
    ALGOLIA_SEARCH_KEY: 'test-search-key',
    ALGOLIA_INDEX: 'www',
    CONTENTFUL_SPACE_ID: 'test-space-id',
    CONTENTFUL_ACCESS_TOKEN: 'test-access-token',
  },
}));

import { rateLimit } from '@/lib/rate/limit';

// Store original fetch
const originalFetch = global.fetch;

// Mock global fetch
const mockFetch = vi.fn();

// Helper to create mock hit matching actual Algolia index structure (flat)
function createMockHit(
  objectID: string,
  title: string,
  summary: string,
  slug: string,
  author: string = 'Test Author',
  imageUrl?: string
) {
  return {
    objectID,
    title,
    summary,
    author,
    url: `/blog/${slug}/`,
    categories: '',
    ...(imageUrl && { image: imageUrl }),
  };
}

// Helper to create mock Algolia search response
function createMockAlgoliaResponse(
  hits: ReturnType<typeof createMockHit>[] = [],
  queryID?: string
) {
  return {
    hits,
    queryID,
    nbHits: hits.length,
    page: 0,
    nbPages: 1,
    hitsPerPage: 5,
    processingTimeMS: 1,
  };
}


describe('GET /api/algolia/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Replace global fetch with mock
    global.fetch = mockFetch;
    // Default: rate limit passes
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 30 });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('30');

      const data = await response.json();
      expect(data).toEqual({ error: 'Too many requests' });
    });

    it('should call rateLimit with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse([], 'test-query-id'),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(
        request,
        'algolia-search',
        { windowSec: 60, max: 10 }
      );
    });
  });

  describe('Click Analytics', () => {
    it('should track click when objectID is provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const request = new Request('http://localhost:3000/api/algolia/search?objectID=123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://insights.algolia.io/1/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Algolia-Application-Id': 'test-app-id',
            'X-Algolia-API-Key': 'test-search-key',
          }),
        })
      );

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should not perform search when objectID is provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const request = new Request('http://localhost:3000/api/algolia/search?objectID=123');
      await GET(request);

      // Only insights API should be called, not search API
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://insights.algolia.io/1/events',
        expect.anything()
      );
    });
  });

  describe('Search Functionality', () => {
    it('should perform search with query parameter', async () => {
      const mockHits = [
        createMockHit('1', 'Test Post', 'Test summary', 'test-post'),
        createMockHit('2', 'Another Post', 'Another summary', 'another-post'),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse(mockHits, 'test-query-id-123'),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=typescript');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-app-id-dsn.algolia.net/1/indexes/www/query',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: 'typescript',
            hitsPerPage: 5,
            clickAnalytics: true,
          }),
        })
      );

      const data = await response.json();
      expect(data.hits).toHaveLength(2);
      expect(data.queryID).toBe('test-query-id-123');
    });

    it('should handle empty query parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse([], undefined),
      });

      const request = new Request('http://localhost:3000/api/algolia/search');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/query'),
        expect.objectContaining({
          body: JSON.stringify({
            query: '',
            hitsPerPage: 5,
            clickAnalytics: true,
          }),
        })
      );
    });

    it('should return empty results when search returns no hits', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse([], 'empty-query-id'),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=nonexistent');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        hits: [],
        queryID: 'empty-query-id',
      });
    });

    it('should normalize Algolia index structure', async () => {
      const mockHits = [
        createMockHit('1', 'Flat Title', 'Flat Summary', 'flat-post', 'Test Author'),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse(mockHits, 'flat-query-id'),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=flat');
      const response = await GET(request);

      const data = await response.json();
      expect(data.hits[0]).toEqual({
        objectID: '1',
        title: 'Flat Title',
        summary: 'Flat Summary',
        author: 'Test Author',
        url: '/blog/flat-post/',
        image: undefined,
        categories: [],
      });
    });

    it('should include image URLs from Algolia index', async () => {
      const mockHits = [
        createMockHit('1', 'Post with Image', 'Summary', 'post-with-image', 'Author', 'https://images.ctfassets.net/test/image.jpg'),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse(mockHits, 'image-query-id'),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=image');
      const response = await GET(request);

      const data = await response.json();
      expect(data.hits[0].image).toBe('https://images.ctfassets.net/test/image.jpg');

      // Only Algolia should be called (no Contentful lookup needed)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle hits without images', async () => {
      const mockHits = [
        createMockHit('1', 'Post without Image', 'Summary', 'no-image'),
      ];

      // First call: Algolia search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse(mockHits, 'no-image-query-id'),
      });

      // Second call: Contentful to fetch missing image
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { post0: { items: [] } } }),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Algolia + Contentful should be called
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const data = await response.json();
      expect(data.hits[0].image).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when search API returns error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({
        hits: [],
        queryID: null,
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = new Request('http://localhost:3000/api/algolia/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.hits).toEqual([]);
      expect(data.queryID).toBeNull();
    });

    it('should handle hits with categories', async () => {
      const mockHits = [{
        objectID: '1',
        title: 'Post with Categories',
        summary: 'Summary',
        author: 'Author',
        url: '/blog/categories-post/',
        categories: 'Tech,JavaScript,Web Development',
      }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse(mockHits, 'query-id'),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.hits[0].categories).toEqual(['Tech', 'JavaScript', 'Web Development']);
    });
  });

  describe('Query Parameter Edge Cases', () => {
    it('should handle special characters in query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAlgoliaResponse([], 'special-query-id'),
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test%20%26%20special');
      await GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/query'),
        expect.objectContaining({
          body: JSON.stringify({
            query: 'test & special',
            hitsPerPage: 5,
            clickAnalytics: true,
          }),
        })
      );
    });

    it('should handle both q and objectID parameters (objectID takes precedence)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test&objectID=456');
      const response = await GET(request);

      // Should call insights API, not search API
      expect(mockFetch).toHaveBeenCalledWith(
        'https://insights.algolia.io/1/events',
        expect.anything()
      );

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });
  });
});
