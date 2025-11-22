import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/algolia/client', () => ({
  aa: vi.fn(),
}));

import { aa } from '@/lib/algolia/client';

describe('POST /api/algolia/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset aa mock to default implementation (no-op)
    vi.mocked(aa).mockImplementation(() => {});
  });

  describe('Success Cases', () => {
    it('should track view event with valid objectID', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: 'blog-post-123' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(aa).toHaveBeenCalledWith('viewedObjectIDs', {
        eventName: 'Blog Viewed',
        index: 'www',
        objectIDs: ['blog-post-123'],
      });

      const data = await response.json();
      expect(data).toEqual({ success: true });
    });

    it('should track click event when eventType is click', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: 'blog-post-123', eventType: 'click' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(aa).toHaveBeenCalledWith('clickedObjectIDs', {
        eventName: 'Blog Clicked',
        index: 'www',
        objectIDs: ['blog-post-123'],
      });
    });

    it('should set user token when provided', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: 'blog-post-123', userToken: 'user_abc123' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(aa).toHaveBeenCalledWith('setUserToken', 'user_abc123');
      expect(aa).toHaveBeenCalledWith('viewedObjectIDs', {
        eventName: 'Blog Viewed',
        index: 'www',
        objectIDs: ['blog-post-123'],
      });
    });

    it('should handle numeric objectID', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: 12345 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(aa).toHaveBeenCalledWith('viewedObjectIDs', {
        eventName: 'Blog Viewed',
        index: 'www',
        objectIDs: [12345],
      });
    });
  });

  describe('Validation', () => {
    it('should return 400 when objectID is missing', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(aa).not.toHaveBeenCalled();

      const data = await response.json();
      expect(data).toEqual({ error: 'objectID is required' });
    });

    it('should return 400 when objectID is null', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: null }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'objectID is required' });
    });

    it('should return 400 when objectID is empty string', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: '' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'objectID is required' });
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when JSON parsing fails', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to track view' });
    });

    it('should return 500 when aa function throws error', async () => {
      vi.mocked(aa).mockImplementation(() => {
        throw new Error('Algolia Analytics Error');
      });

      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: 'test-id' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to track view' });
    });
  });

  describe('Request Body Edge Cases', () => {
    it('should handle extra fields in request body', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectID: 'test-id',
          extraField: 'ignored',
          anotherField: 123,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(aa).toHaveBeenCalledWith('viewedObjectIDs', {
        eventName: 'Blog Viewed',
        index: 'www',
        objectIDs: ['test-id'],
      });
    });

    it('should handle objectID with special characters', async () => {
      const request = new Request('http://localhost:3000/api/algolia/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectID: 'post-123-@-special!' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(aa).toHaveBeenCalledWith('viewedObjectIDs', {
        eventName: 'Blog Viewed',
        index: 'www',
        objectIDs: ['post-123-@-special!'],
      });
    });
  });
});
