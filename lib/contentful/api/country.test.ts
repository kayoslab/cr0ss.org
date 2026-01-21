import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllCountries, getCountry } from './country';

// Mock the fetchGraphQL function
vi.mock('./api', () => ({
  fetchGraphQL: vi.fn(),
}));

describe('lib/contentful/api/country', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllCountries', () => {
    it('should return all countries ordered by ID', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          countryCollection: {
            items: [
              { id: 'US', name: 'United States' },
              { id: 'CA', name: 'Canada' },
              { id: 'MX', name: 'Mexico' },
            ],
          },
        },
      });

      const result = await getAllCountries();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('US');
      expect(result[1].id).toBe('CA');
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('order: id_ASC'),
        ['countries']
      );
    });

    it('should use high limit to fetch all countries', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          countryCollection: {
            items: [],
          },
        },
      });

      await getAllCountries();

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('limit: 1000'),
        ['countries']
      );
    });

    it('should handle empty response', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          countryCollection: {
            items: [],
          },
        },
      });

      const result = await getAllCountries();

      expect(result).toEqual([]);
    });

    it('should handle missing data', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
      });

      const result = await getAllCountries();

      expect(result).toEqual([]);
    });
  });

  describe('getCountry', () => {
    it('should return a single country by ID', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          countryCollection: {
            items: [
              {
                id: 'US',
                name: 'United States',
              },
            ],
          },
        },
      });

      const result = await getCountry('US');

      expect(result.id).toBe('US');
      expect(result.name).toBe('United States');
    });

    it('should use correct query parameters', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          countryCollection: {
            items: [{ id: 'CA', name: 'Canada' }],
          },
        },
      });

      await getCountry('CA');

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('id: "CA"'),
        ['CA']
      );
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('limit: 1'),
        ['CA']
      );
    });

    it('should return undefined when country not found', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          countryCollection: {
            items: [],
          },
        },
      });

      const result = await getCountry('XX');

      expect(result).toBeUndefined();
    });

    it('should handle missing data', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
      });

      const result = await getCountry('US');

      expect(result).toBeUndefined();
    });
  });
});
