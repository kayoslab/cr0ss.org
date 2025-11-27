import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/auth/secret', () => ({
  hasValidSecret: vi.fn(),
}));

vi.mock('@/lib/api/middleware', () => {
  return {
    createErrorResponse: vi.fn((error: string, status: number, details?: unknown, code?: string) => {
      const response: { error: string; details?: unknown; code?: string } = { error };
      if (details !== undefined) response.details = details;
      if (code) response.code = code;
      return NextResponse.json(response, { status });
    }),
    createSuccessResponse: vi.fn((data: unknown, status: number = 200) => {
      return NextResponse.json(data, { status });
    }),
  };
});

vi.mock('@/lib/contentful/api/blog', () => ({
  getBlog: vi.fn(),
}));

vi.mock('algoliasearch', () => ({
  algoliasearch: vi.fn(() => ({
    addOrUpdateObject: vi.fn(),
  })),
}));

vi.mock('@/env', () => ({
  env: {
    ALGOLIA_APP_ID: 'test-app-id',
    ALGOLIA_ADMIN_KEY: 'test-admin-key',
    ALGOLIA_INDEX: 'test-index',
  },
}));

vi.mock('@/lib/obs/trace', () => ({
  wrapTrace: <T extends (...args: unknown[]) => unknown>(_name: string, fn: T): T => fn,
}));

import { revalidatePath, revalidateTag } from 'next/cache';
import { hasValidSecret } from '@/lib/auth/secret';
import { getBlog } from '@/lib/contentful/api/blog';
import { algoliasearch } from 'algoliasearch';

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasValidSecret).mockReturnValue(true);
    
    // Setup Algolia mock
    const mockAlgoliaClient = {
      addOrUpdateObject: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(algoliasearch).mockReturnValue(mockAlgoliaClient as never);
  });

  describe('Authentication', () => {
    it('should require valid secret', async () => {
      vi.mocked(hasValidSecret).mockReturnValue(false);

      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'blogPosts' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(hasValidSecret).toHaveBeenCalledWith(request);
      
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should accept valid secret', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'blogPosts' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(hasValidSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Legacy Format', () => {
    it('should revalidate tag from legacy format', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'blogPosts' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalledWith('blogPosts', 'max');

      const data = await response.json();
      expect(data.tags).toContain('blogPosts');
    });

    it('should revalidate path from legacy format', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/blog' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidatePath).toHaveBeenCalledWith('/blog');
      
      const data = await response.json();
      expect(data.paths).toContain('/blog');
    });

    it('should revalidate both tag and path from legacy format', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'blogPosts', path: '/blog' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalledWith('blogPosts', 'max');
      expect(revalidatePath).toHaveBeenCalledWith('/blog');
    });
  });

  describe('Blog Post Revalidation', () => {
    it('should revalidate blog post tags and paths', async () => {
      // Mock getBlog to return a valid blog post
      const mockBlogPost = {
        sys: { id: 'blog-456' },
        slug: 'my-blog-post',
        title: 'My Blog Post',
        summary: 'A test blog post',
        author: 'Test Author',
        heroImage: { url: 'https://example.com/hero.jpg' },
        categoriesCollection: {
          items: [{ title: 'Technology' }],
        },
      };
      vi.mocked(getBlog).mockResolvedValue(mockBlogPost as never);

      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            type: 'Entry',
            contentType: {
              sys: { id: 'blogPost' },
            },
          },
          fields: {
            slug: { 'en-US': 'my-blog-post' },
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalledWith('blogPosts', 'max');
      expect(revalidateTag).toHaveBeenCalledWith('my-blog-post', 'max');
      expect(revalidatePath).toHaveBeenCalledWith('/blog');
      expect(revalidatePath).toHaveBeenCalledWith('/blog/my-blog-post');
      
      const data = await response.json();
      expect(data.tags).toEqual(['blogPosts', 'my-blog-post']);
      expect(data.paths).toEqual(['/blog', '/blog/my-blog-post']);
      expect(data.algoliaIndexed).toBe(true);
    });

    it('should update Algolia index for blog posts', async () => {
      const mockBlogPost = {
        sys: { id: 'blog-123' },
        slug: 'test-post',
        title: 'Test Post',
        summary: 'A test post',
        author: 'Test Author',
        heroImage: { url: 'https://example.com/image.jpg' },
        categoriesCollection: {
          items: [
            { title: 'Tech' },
            { title: 'Design' },
          ],
        },
      };
      vi.mocked(getBlog).mockResolvedValue(mockBlogPost as never);

      const mockAlgoliaClient = {
        addOrUpdateObject: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(algoliasearch).mockReturnValue(mockAlgoliaClient as never);

      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: {
            slug: { 'en-US': 'test-post' },
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(getBlog).toHaveBeenCalledWith('test-post');
      expect(mockAlgoliaClient.addOrUpdateObject).toHaveBeenCalledWith({
        indexName: 'test-index',
        objectID: 'blog-123',
        body: {
          url: '/blog/test-post/',
          title: 'Test Post',
          summary: 'A test post',
          author: 'Test Author',
          categories: 'Tech,Design',
          image: 'https://example.com/image.jpg',
          objectID: 'blog-123',
        },
      });
      
      const data = await response.json();
      expect(data.algoliaIndexed).toBe(true);
    });

    it('should handle Algolia failures gracefully', async () => {
      vi.mocked(getBlog).mockRejectedValue(new Error('Algolia error'));

      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: {
            slug: { 'en-US': 'test-post' },
          },
        }),
      });
      const response = await POST(request);

      // Should still succeed even if Algolia fails
      expect(response.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });
  });

  describe('Page Revalidation', () => {
    it('should revalidate page tags and paths', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            contentType: { sys: { id: 'page' } },
          },
          fields: {
            slug: { 'en-US': 'about' },
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalledWith('pages', 'max');
      expect(revalidateTag).toHaveBeenCalledWith('about', 'max');
      expect(revalidatePath).toHaveBeenCalledWith('/page/about');
      
      const data = await response.json();
      expect(data.tags).toEqual(['pages', 'about']);
      expect(data.paths).toEqual(['/page/about']);
    });
  });

  describe('Country Revalidation', () => {
    it('should revalidate country data', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            contentType: { sys: { id: 'country' } },
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalledWith('countries', 'max');
      expect(revalidatePath).toHaveBeenCalledWith('/');
      
      const data = await response.json();
      expect(data.tags).toEqual(['countries']);
      expect(data.paths).toEqual(['/']);
    });
  });

  describe('Coffee Revalidation', () => {
    it('should revalidate coffee data', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            id: 'coffee-123',
            contentType: { sys: { id: 'coffee' } },
          },
          fields: {
            slug: { 'en-US': 'test-coffee-slug' },
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidateTag).toHaveBeenCalledWith('coffee', 'max');
      expect(revalidateTag).toHaveBeenCalledWith('test-coffee-slug', 'max');
      expect(revalidatePath).toHaveBeenCalledWith('/coffee');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
      expect(revalidatePath).toHaveBeenCalledWith('/coffee/test-coffee-slug');

      const data = await response.json();
      expect(data.tags).toEqual(['coffee', 'test-coffee-slug']);
      expect(data.paths).toEqual(['/coffee', '/dashboard', '/coffee/test-coffee-slug']);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when no revalidation targets determined', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(revalidateTag).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
      
      const data = await response.json();
      expect(data.error).toBe('No revalidation targets determined from payload');
      expect(data.code).toBe('MISSING_TARGETS');
      expect(data.details).toEqual({ payload: {} });
    });

    it('should handle unknown content types', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            contentType: { sys: { id: 'unknownType' } },
          },
        }),
      });
      const response = await POST(request);

      // Should return 400 as no tags/paths were determined
      expect(response.status).toBe(400);
    });

    it('should return 500 on JSON parse error', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Failed to revalidate');
      expect(data.code).toBe('REVALIDATION_ERROR');
    });
  });

  describe('Response Structure', () => {
    it('should return complete response with timestamp', async () => {
      const request = new Request('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sys: {
            contentType: { sys: { id: 'blogPost' } },
          },
          fields: {
            slug: { 'en-US': 'test' },
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('revalidated', true);
      expect(data).toHaveProperty('tags');
      expect(data).toHaveProperty('paths');
      expect(data).toHaveProperty('algoliaIndexed');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.timestamp).toBe('number');
    });
  });
});
