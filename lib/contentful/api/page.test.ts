import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllPages, getPage } from './page';

// Mock the fetchGraphQL function
vi.mock('./api', () => ({
  fetchGraphQL: vi.fn(),
}));

describe('lib/contentful/api/page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllPages', () => {
    it('should return all pages with default limit', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          pageCollection: {
            items: [
              { title: 'Home', slug: 'home' },
              { title: 'About', slug: 'about' },
            ],
          },
        },
      });

      const result = await getAllPages();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Home');
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('limit: 10'),
        ['pages']
      );
    });

    it('should respect custom limit', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          pageCollection: {
            items: Array.from({ length: 20 }, (_, i) => ({
              title: `Page ${i + 1}`,
              slug: `page-${i + 1}`,
            })),
          },
        },
      });

      const result = await getAllPages(20);

      expect(result).toHaveLength(20);
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('limit: 20'),
        ['pages']
      );
    });

    it('should handle empty results', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          pageCollection: {
            items: [],
          },
        },
      });

      const result = await getAllPages();

      expect(result).toEqual([]);
    });
  });

  describe('getPage', () => {
    it('should return a single page by slug', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          pageCollection: {
            items: [
              {
                title: 'About Us',
                slug: 'about',
                content: 'This is the about page',
              },
            ],
          },
        },
      });

      const result = await getPage('about');

      expect(result.title).toBe('About Us');
      expect(result.slug).toBe('about');
    });

    it('should use correct query parameters', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          pageCollection: {
            items: [{ title: 'Contact', slug: 'contact' }],
          },
        },
      });

      await getPage('contact');

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('slug: "contact"'),
        ['contact']
      );
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('limit: 1'),
        ['contact']
      );
    });

    it('should return undefined when page not found', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          pageCollection: {
            items: [],
          },
        },
      });

      const result = await getPage('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should use slug as cache tag', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          pageCollection: {
            items: [{ title: 'Test', slug: 'test-page' }],
          },
        },
      });

      await getPage('test-page');

      expect(fetchGraphQL).toHaveBeenCalledWith(expect.any(String), ['test-page']);
    });
  });
});
