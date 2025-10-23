import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllBlogs, getBlog } from './blog';

// Mock the fetchGraphQL function
vi.mock('./api', () => ({
  fetchGraphQL: vi.fn(),
}));

describe('lib/contentful/api/blog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllBlogs', () => {
    it('should return all blog posts with pagination', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          blogPostCollection: {
            total: 25,
            skip: 0,
            limit: 9,
            items: [
              {
                title: 'First Blog Post',
                slug: 'first-blog-post',
                summary: 'This is a summary',
              },
              {
                title: 'Second Blog Post',
                slug: 'second-blog-post',
                summary: 'Another summary',
              },
            ],
          },
        },
      });

      const result = await getAllBlogs(1, 9);

      expect(result.total).toBe(25);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].title).toBe('First Blog Post');
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('blogPostCollection'),
        ['blogPosts']
      );
    });

    it('should handle pagination correctly', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          blogPostCollection: {
            total: 25,
            skip: 18,
            limit: 9,
            items: [],
          },
        },
      });

      const result = await getAllBlogs(3, 9);

      expect(result.skip).toBe(18);
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('skip: 18'),
        ['blogPosts']
      );
    });

    it('should return empty collection on error', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getAllBlogs(1, 9);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.limit).toBe(9);
    });

    it('should handle missing data gracefully', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
      });

      const result = await getAllBlogs();

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should use correct default pagination', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          blogPostCollection: {
            total: 0,
            skip: 0,
            limit: 9,
            items: [],
          },
        },
      });

      await getAllBlogs();

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('limit: 9'),
        ['blogPosts']
      );
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('skip: 0'),
        ['blogPosts']
      );
    });
  });

  describe('getBlog', () => {
    it('should return a single blog post by slug', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          blogPostCollection: {
            total: 1,
            items: [
              {
                title: 'My Blog Post',
                slug: 'my-blog-post',
                summary: 'This is my blog post',
                content: 'Full content here',
              },
            ],
          },
        },
      });

      const result = await getBlog('my-blog-post');

      expect(result.title).toBe('My Blog Post');
      expect(result.slug).toBe('my-blog-post');
    });

    it('should escape special characters in slug', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          blogPostCollection: {
            total: 1,
            items: [
              {
                title: 'Test Post',
                slug: 'test-"post"',
              },
            ],
          },
        },
      });

      await getBlog('test-"post"');

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('test-\\"post\\"'),
        ['blogPosts', 'test-"post"']
      );
    });

    it('should throw error when blog post not found', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          blogPostCollection: {
            total: 0,
            items: [],
          },
        },
      });

      await expect(getBlog('nonexistent-slug')).rejects.toThrow(
        'Blog post with slug nonexistent-slug not found'
      );
    });

    it('should throw error on invalid response structure', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
      });

      await expect(getBlog('test-slug')).rejects.toThrow(
        'Invalid response structure'
      );
    });

    it('should use correct tags for cache revalidation', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          blogPostCollection: {
            total: 1,
            items: [
              {
                title: 'Test',
                slug: 'test-slug',
              },
            ],
          },
        },
      });

      await getBlog('test-slug');

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.any(String),
        ['blogPosts', 'test-slug']
      );
    });
  });
});
