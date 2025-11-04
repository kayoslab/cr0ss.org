import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SearchCache } from './cache';

describe('SearchCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create cache with default TTL of 5 minutes', () => {
      const cache = new SearchCache();
      cache.set('key', 'value');

      // Should still be valid after 4 minutes 59 seconds
      vi.advanceTimersByTime(299 * 1000);
      expect(cache.get('key')).toBe('value');

      // Should expire after 5 minutes
      vi.advanceTimersByTime(2 * 1000);
      expect(cache.get('key')).toBeNull();
    });

    it('should create cache with custom TTL', () => {
      const cache = new SearchCache(60); // 1 minute
      cache.set('key', 'value');

      // Should still be valid after 59 seconds
      vi.advanceTimersByTime(59 * 1000);
      expect(cache.get('key')).toBe('value');

      // Should expire after 60 seconds
      vi.advanceTimersByTime(2 * 1000);
      expect(cache.get('key')).toBeNull();
    });

    it('should accept zero TTL', () => {
      const cache = new SearchCache(0);
      cache.set('key', 'value');

      // Should expire immediately
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBeNull();
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const cache = new SearchCache();
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should return cached data for valid key', () => {
      const cache = new SearchCache();
      const data = { foo: 'bar' };
      cache.set('key', data);

      expect(cache.get('key')).toEqual(data);
    });

    it('should return null for expired entry', () => {
      const cache = new SearchCache(60); // 1 minute
      cache.set('key', 'value');

      // Advance time past TTL
      vi.advanceTimersByTime(61 * 1000);

      expect(cache.get('key')).toBeNull();
    });

    it('should delete expired entry from cache', () => {
      const cache = new SearchCache(60);
      cache.set('key', 'value');

      // Advance time past TTL
      vi.advanceTimersByTime(61 * 1000);

      cache.get('key'); // This should delete the entry

      // Verify entry was deleted by checking again
      expect(cache.get('key')).toBeNull();
    });

    it('should handle multiple keys independently', () => {
      const cache = new SearchCache(60);
      cache.set('key1', 'value1');

      vi.advanceTimersByTime(30 * 1000); // 30 seconds

      cache.set('key2', 'value2');

      // Advance 35 more seconds (total 65 for key1, 35 for key2)
      vi.advanceTimersByTime(35 * 1000);

      expect(cache.get('key1')).toBeNull(); // Expired (65s)
      expect(cache.get('key2')).toBe('value2'); // Still valid (35s)
    });

    it('should cache different data types', () => {
      const cache = new SearchCache();

      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);
      cache.set('null', null);
      cache.set('undefined', undefined);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should store data with timestamp', () => {
      const cache = new SearchCache();
      const data = 'test data';

      cache.set('key', data);

      expect(cache.get('key')).toBe(data);
    });

    it('should overwrite existing key', () => {
      const cache = new SearchCache();

      cache.set('key', 'old value');
      cache.set('key', 'new value');

      expect(cache.get('key')).toBe('new value');
    });

    it('should reset TTL when overwriting', () => {
      const cache = new SearchCache(60); // 1 minute

      cache.set('key', 'value1');

      // Advance 50 seconds
      vi.advanceTimersByTime(50 * 1000);

      // Overwrite the key
      cache.set('key', 'value2');

      // Advance another 50 seconds (total 100s from first set, 50s from second)
      vi.advanceTimersByTime(50 * 1000);

      // Should still be valid since TTL was reset on second set
      expect(cache.get('key')).toBe('value2');
    });

    it('should handle empty string key', () => {
      const cache = new SearchCache();
      cache.set('', 'empty key value');

      expect(cache.get('')).toBe('empty key value');
    });

    it('should handle special characters in key', () => {
      const cache = new SearchCache();
      const specialKey = 'key with spaces and symbols !@#$%^&*()';

      cache.set(specialKey, 'special value');

      expect(cache.get(specialKey)).toBe('special value');
    });
  });

  describe('TTL boundary conditions', () => {
    it('should return data at exact TTL boundary (still valid)', () => {
      const cache = new SearchCache(60);
      cache.set('key', 'value');

      // Advance to exactly TTL (60000ms)
      vi.advanceTimersByTime(60 * 1000);

      // Should still be valid (using > not >=, so exactly at TTL is still valid)
      expect(cache.get('key')).toBe('value');

      // Advance 1 more millisecond to exceed TTL
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBeNull();
    });

    it('should handle very short TTL', () => {
      const cache = new SearchCache(1); // 1 second
      cache.set('key', 'value');

      vi.advanceTimersByTime(500); // 0.5 seconds
      expect(cache.get('key')).toBe('value');

      vi.advanceTimersByTime(600); // Total 1.1 seconds
      expect(cache.get('key')).toBeNull();
    });

    it('should handle very long TTL', () => {
      const cache = new SearchCache(86400); // 24 hours
      cache.set('key', 'value');

      // Advance 23 hours
      vi.advanceTimersByTime(23 * 60 * 60 * 1000);
      expect(cache.get('key')).toBe('value');

      // Advance to 24 hours + 1ms
      vi.advanceTimersByTime((60 * 60 * 1000) + 1);
      expect(cache.get('key')).toBeNull();
    });
  });

  describe('cache isolation', () => {
    it('should maintain separate caches for different instances', () => {
      const cache1 = new SearchCache();
      const cache2 = new SearchCache();

      cache1.set('key', 'value1');
      cache2.set('key', 'value2');

      expect(cache1.get('key')).toBe('value1');
      expect(cache2.get('key')).toBe('value2');
    });

    it('should not share state between instances', () => {
      const cache1 = new SearchCache(60);
      const cache2 = new SearchCache(120);

      cache1.set('key', 'value');

      // cache2 should not have the key from cache1
      expect(cache2.get('key')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle getting and setting the same key rapidly', () => {
      const cache = new SearchCache();

      for (let i = 0; i < 100; i++) {
        cache.set('key', i);
        expect(cache.get('key')).toBe(i);
      }
    });

    it('should handle large objects', () => {
      const cache = new SearchCache();
      const largeObject = {
        data: Array(1000).fill({ nested: { value: 'test' } })
      };

      cache.set('large', largeObject);
      expect(cache.get('large')).toEqual(largeObject);
    });

    it('should not mutate stored objects', () => {
      const cache = new SearchCache();
      const obj = { foo: 'bar' };

      cache.set('key', obj);

      // Mutate the original object
      obj.foo = 'baz';

      // Cache should still have the mutated reference (no deep copy)
      const cached = cache.get('key') as { foo: string };
      expect(cached.foo).toBe('baz');
    });
  });
});
