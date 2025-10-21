import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/rate/limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/algolia/client', () => ({
  searchClient: {
    search: vi.fn(),
  },
  aa: vi.fn(),
}));

import { rateLimit } from '@/lib/rate/limit';
import { searchClient, aa } from '@/lib/algolia/client';

describe('GET /api/algolia/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit passes
    vi.mocked(rateLimit).mockResolvedValue({ ok: true, retryAfterSec: 0 });
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
      const request = new Request('http://localhost:3000/api/algolia/search?q=test');

      vi.mocked(searchClient.search).mockResolvedValue({
        results: [{
          hits: [],
          queryID: 'test-query-id',
        }],
      });

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
      const request = new Request('http://localhost:3000/api/algolia/search?objectID=123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(aa).toHaveBeenCalledWith('clickedObjectIDs', {
        eventName: 'Post Clicked',
        index: 'www',
        objectIDs: ['123'],
      });

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should not perform search when objectID is provided', async () => {
      const request = new Request('http://localhost:3000/api/algolia/search?objectID=123');
      await GET(request);

      expect(searchClient.search).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search with query parameter', async () => {
      const mockHits = [
        { objectID: '1', title: 'Test Post', summary: 'Test summary' },
        { objectID: '2', title: 'Another Post', summary: 'Another summary' },
      ];

      vi.mocked(searchClient.search).mockResolvedValue({
        results: [{
          hits: mockHits,
          queryID: 'test-query-id-123',
        }],
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=typescript');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(searchClient.search).toHaveBeenCalledWith([{
        indexName: 'www',
        params: {
          query: 'typescript',
          hitsPerPage: 5,
          clickAnalytics: true,
        },
      }]);

      const data = await response.json();
      expect(data).toEqual({
        hits: mockHits,
        queryID: 'test-query-id-123',
      });
    });

    it('should handle empty query parameter', async () => {
      vi.mocked(searchClient.search).mockResolvedValue({
        results: [{
          hits: [],
          queryID: null,
        }],
      });

      const request = new Request('http://localhost:3000/api/algolia/search');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(searchClient.search).toHaveBeenCalledWith([{
        indexName: 'www',
        params: {
          query: '',
          hitsPerPage: 5,
          clickAnalytics: true,
        },
      }]);
    });

    it('should return empty results when search returns no hits', async () => {
      vi.mocked(searchClient.search).mockResolvedValue({
        results: [{
          hits: [],
          queryID: 'empty-query-id',
        }],
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
  });

  describe('Error Handling', () => {
    it('should return 500 when search client throws error', async () => {
      vi.mocked(searchClient.search).mockRejectedValue(new Error('Algolia service unavailable'));

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
      vi.mocked(searchClient.search).mockRejectedValue(new Error('Network error'));

      const request = new Request('http://localhost:3000/api/algolia/search?q=test');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.hits).toEqual([]);
      expect(data.queryID).toBeNull();
    });
  });

  describe('Query Parameter Edge Cases', () => {
    it('should handle special characters in query', async () => {
      vi.mocked(searchClient.search).mockResolvedValue({
        results: [{
          hits: [],
          queryID: 'special-query-id',
        }],
      });

      const request = new Request('http://localhost:3000/api/algolia/search?q=test%20%26%20special');
      await GET(request);

      expect(searchClient.search).toHaveBeenCalledWith([{
        indexName: 'www',
        params: {
          query: 'test & special',
          hitsPerPage: 5,
          clickAnalytics: true,
        },
      }]);
    });

    it('should handle both q and objectID parameters (objectID takes precedence)', async () => {
      const request = new Request('http://localhost:3000/api/algolia/search?q=test&objectID=456');
      const response = await GET(request);

      expect(aa).toHaveBeenCalled();
      expect(searchClient.search).not.toHaveBeenCalled();

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });
  });
});
