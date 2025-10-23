import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllCoffee, getCoffees, getCoffee, getAllCoffeeDTO } from './coffee';

// Mock the fetchGraphQL function
vi.mock('./api', () => ({
  fetchGraphQL: vi.fn(),
}));

describe('lib/contentful/api/coffee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllCoffee', () => {
    it('should return all coffees with pagination', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 25,
            skip: 0,
            limit: 9,
            items: [
              {
                sys: { id: '1' },
                name: 'Ethiopian Yirgacheffe',
                roaster: 'Coffee Roasters Co',
                country: { name: 'Ethiopia' },
              },
              {
                sys: { id: '2' },
                name: 'Colombian Supremo',
                roaster: 'Bean Masters',
                country: { name: 'Colombia' },
              },
            ],
          },
        },
      });

      const result = await getAllCoffee(1, 9);

      expect(result.total).toBe(25);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Ethiopian Yirgacheffe');
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('coffeeCollection'),
        ['coffee']
      );
    });

    it('should handle pagination correctly', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 25,
            skip: 9,
            limit: 9,
            items: [],
          },
        },
      });

      const result = await getAllCoffee(2, 9);

      expect(result.skip).toBe(9);
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('skip: 9'),
        ['coffee']
      );
    });

    it('should return empty collection on error', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getAllCoffee(1, 9);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle invalid response structure', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
      });

      const result = await getAllCoffee();

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getCoffees', () => {
    it('should return coffees by IDs', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 2,
            skip: 0,
            limit: 10,
            items: [
              {
                sys: { id: 'coffee1' },
                name: 'Ethiopian Yirgacheffe',
                roaster: 'Coffee Roasters Co',
                country: { name: 'Ethiopia' },
                decaffeinated: false,
              },
              {
                sys: { id: 'coffee2' },
                name: 'Decaf Blend',
                roaster: 'Decaf Masters',
                country: { name: 'Colombia' },
                decaffeinated: true,
              },
            ],
          },
        },
      });

      const result = await getCoffees(['coffee1', 'coffee2']);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Ethiopian Yirgacheffe');
      expect(result.items[1].decaffeinated).toBe(true);
    });

    it('should format IDs correctly in query', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            items: [],
            total: 0,
            skip: 0,
            limit: 10,
          },
        },
      });

      await getCoffees(['id1', 'id2', 'id3']);

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('id_in: ["id1","id2","id3"]'),
        ['id1', 'id2', 'id3']
      );
    });

    it('should throw error on fetch failure', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('API error')
      );

      await expect(getCoffees(['coffee1'])).rejects.toThrow('API error');
    });

    it('should throw error on invalid response', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
      });

      await expect(getCoffees(['coffee1'])).rejects.toThrow(
        'Invalid response structure'
      );
    });
  });

  describe('getCoffee', () => {
    it('should return a single coffee by ID', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 1,
            items: [
              {
                sys: { id: 'coffee1' },
                name: 'Ethiopian Yirgacheffe',
                roaster: 'Coffee Roasters Co',
                country: { name: 'Ethiopia' },
              },
            ],
          },
        },
      });

      const result = await getCoffee('coffee1');

      expect(result.name).toBe('Ethiopian Yirgacheffe');
      expect(result.sys?.id).toBe('coffee1');
    });

    it('should throw error when coffee not found', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 0,
            items: [],
          },
        },
      });

      await expect(getCoffee('nonexistent')).rejects.toThrow(
        'Coffee with id nonexistent not found'
      );
    });

    it('should use correct query parameters', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 1,
            items: [
              {
                sys: { id: 'test-id' },
                name: 'Test Coffee',
              },
            ],
          },
        },
      });

      await getCoffee('test-id');

      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('sys_id: "test-id"'),
        ['test-id']
      );
      expect(fetchGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('limit: 1'),
        ['test-id']
      );
    });
  });

  describe('getAllCoffeeDTO', () => {
    it('should return formatted DTO with minimal fields', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 2,
            skip: 0,
            limit: 20,
            items: [
              {
                sys: { id: 'coffee1' },
                name: 'Ethiopian Yirgacheffe',
                roaster: 'Coffee Roasters Co',
              },
              {
                sys: { id: 'coffee2' },
                name: 'Colombian Supremo',
                roaster: 'Bean Masters',
              },
            ],
          },
        },
      });

      const result = await getAllCoffeeDTO(1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({
        id: 'coffee1',
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Coffee Roasters Co',
      });
      expect(result.items[1]).toEqual({
        id: 'coffee2',
        name: 'Colombian Supremo',
        roaster: 'Bean Masters',
      });
    });

    it('should handle missing fields gracefully', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 1,
            skip: 0,
            limit: 20,
            items: [
              {
                sys: {},
                // Missing name and roaster
              },
            ],
          },
        },
      });

      const result = await getAllCoffeeDTO();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('');
      expect(result.items[0].name).toBe('');
      expect(result.items[0].roaster).toBe('');
    });

    it('should handle empty response', async () => {
      const { fetchGraphQL } = await import('./api');

      (fetchGraphQL as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          coffeeCollection: {
            total: 0,
            skip: 0,
            limit: 20,
            items: [],
          },
        },
      });

      const result = await getAllCoffeeDTO();

      expect(result.items).toEqual([]);
    });
  });
});
