import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBodyProfile } from './profile';

// Mock the database module
vi.mock('@/lib/db/profile', () => ({
  getBodyProfileDB: vi.fn(),
}));

import { getBodyProfileDB } from '@/lib/db/profile';

describe('getBodyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear all env vars before each test
    delete process.env.BODY_WEIGHT_KG;
    delete process.env.BODY_HEIGHT_CM;
    delete process.env.BODY_VD_L_PER_KG;
    delete process.env.BODY_HALF_LIFE_H;
    delete process.env.BODY_CAFFEINE_SENSITIVITY;
    delete process.env.BODY_BIOAVAILABILITY;
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.BODY_WEIGHT_KG;
    delete process.env.BODY_HEIGHT_CM;
    delete process.env.BODY_VD_L_PER_KG;
    delete process.env.BODY_HALF_LIFE_H;
    delete process.env.BODY_CAFFEINE_SENSITIVITY;
    delete process.env.BODY_BIOAVAILABILITY;
  });

  describe('Database Success Cases', () => {
    it('should return profile data from database when available', async () => {
      const mockDBProfile = {
        id: 1,
        weight_kg: 80,
        height_cm: 185,
        age: 32,
        sex: 'male' as const,
        half_life_hours: 5.5,
        caffeine_sensitivity: 1.2,
        bioavailability: 0.95,
        vd_l_per_kg: 0.65,
        body_fat_percentage: 18,
        muscle_percentage: 42,
        notes: null,
        measured_at: '2025-01-15T10:00:00Z',
        created_at: '2025-01-15T10:00:00Z',
      };

      vi.mocked(getBodyProfileDB).mockResolvedValue(mockDBProfile);

      const result = await getBodyProfile();

      expect(result).toEqual({
        weight_kg: 80,
        height_cm: 185,
        body_fat_percentage: 18,
        muscle_percentage: 42,
        vd_l_per_kg: 0.65,
        half_life_hours: 5.5,
        caffeine_sensitivity: 1.2,
        bioavailability: 0.95,
        age: 32,
        sex: 'male',
      });
      expect(getBodyProfileDB).toHaveBeenCalledOnce();
    });

    it('should convert null database fields to undefined', async () => {
      const mockDBProfile = {
        id: 1,
        weight_kg: 75,
        height_cm: null,
        age: null,
        sex: null,
        half_life_hours: null,
        caffeine_sensitivity: null,
        bioavailability: null,
        vd_l_per_kg: null,
        body_fat_percentage: null,
        muscle_percentage: null,
        notes: null,
        measured_at: '2025-01-15T10:00:00Z',
        created_at: '2025-01-15T10:00:00Z',
      };

      vi.mocked(getBodyProfileDB).mockResolvedValue(mockDBProfile);

      const result = await getBodyProfile();

      expect(result).toEqual({
        weight_kg: 75,
        height_cm: undefined,
        body_fat_percentage: undefined,
        muscle_percentage: undefined,
        vd_l_per_kg: undefined,
        half_life_hours: undefined,
        caffeine_sensitivity: undefined,
        bioavailability: undefined,
        age: undefined,
        sex: undefined,
      });
    });

    it('should handle minimal database profile with only required fields', async () => {
      const mockDBProfile = {
        id: 1,
        weight_kg: 70,
        height_cm: null,
        age: null,
        sex: null,
        half_life_hours: null,
        caffeine_sensitivity: null,
        bioavailability: null,
        vd_l_per_kg: null,
        body_fat_percentage: null,
        muscle_percentage: null,
        notes: null,
        measured_at: '2025-01-15T10:00:00Z',
        created_at: '2025-01-15T10:00:00Z',
      };

      vi.mocked(getBodyProfileDB).mockResolvedValue(mockDBProfile);

      const result = await getBodyProfile();

      expect(result.weight_kg).toBe(70);
      expect(result.height_cm).toBeUndefined();
      expect(result.half_life_hours).toBeUndefined();
    });
  });

  describe('Database Failure - Environment Fallbacks', () => {
    it('should fall back to default values when database fails', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      const result = await getBodyProfile();

      expect(result).toEqual({
        weight_kg: 75,
        height_cm: 180,
        vd_l_per_kg: 0.6,
        half_life_hours: 5,
        caffeine_sensitivity: 1.0,
        bioavailability: 0.9,
      });
    });

    it('should use environment variables when database fails', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = '82';
      process.env.BODY_HEIGHT_CM = '190';
      process.env.BODY_VD_L_PER_KG = '0.7';
      process.env.BODY_HALF_LIFE_H = '6';
      process.env.BODY_CAFFEINE_SENSITIVITY = '0.8';
      process.env.BODY_BIOAVAILABILITY = '0.85';

      const result = await getBodyProfile();

      expect(result).toEqual({
        weight_kg: 82,
        height_cm: 190,
        vd_l_per_kg: 0.7,
        half_life_hours: 6,
        caffeine_sensitivity: 0.8,
        bioavailability: 0.85,
      });
    });

    it('should handle partial environment variables with defaults', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = '85';
      process.env.BODY_HALF_LIFE_H = '5.5';

      const result = await getBodyProfile();

      expect(result).toEqual({
        weight_kg: 85,
        height_cm: 180, // default
        vd_l_per_kg: 0.6, // default
        half_life_hours: 5.5,
        caffeine_sensitivity: 1.0, // default
        bioavailability: 0.9, // default
      });
    });

    it('should handle invalid environment variable values', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = 'not-a-number';
      process.env.BODY_HEIGHT_CM = 'invalid';
      process.env.BODY_HALF_LIFE_H = 'NaN';

      const result = await getBodyProfile();

      // Should use defaults when env vars are invalid
      expect(result).toEqual({
        weight_kg: 75,
        height_cm: 180,
        vd_l_per_kg: 0.6,
        half_life_hours: 5,
        caffeine_sensitivity: 1.0,
        bioavailability: 0.9,
      });
    });

    it('should handle empty string environment variables', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = '';
      process.env.BODY_HEIGHT_CM = '';

      const result = await getBodyProfile();

      // Empty strings should be treated as missing, use defaults
      expect(result.weight_kg).toBe(75);
      expect(result.height_cm).toBe(180);
    });

    it('should handle Infinity and -Infinity as invalid numbers', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = 'Infinity';
      process.env.BODY_HEIGHT_CM = '-Infinity';

      const result = await getBodyProfile();

      // Infinity should use defaults
      expect(result.weight_kg).toBe(75);
      expect(result.height_cm).toBe(180);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database returning zero values', async () => {
      const mockDBProfile = {
        id: 1,
        weight_kg: 0, // Edge case: zero weight
        height_cm: 0,
        age: 0,
        sex: 'other' as const,
        half_life_hours: 0,
        caffeine_sensitivity: 0,
        bioavailability: 0,
        vd_l_per_kg: 0,
        body_fat_percentage: 0,
        muscle_percentage: 0,
        notes: null,
        measured_at: '2025-01-15T10:00:00Z',
        created_at: '2025-01-15T10:00:00Z',
      };

      vi.mocked(getBodyProfileDB).mockResolvedValue(mockDBProfile);

      const result = await getBodyProfile();

      // Zero values should be preserved (they're valid numbers)
      expect(result.weight_kg).toBe(0);
      expect(result.height_cm).toBe(0);
      expect(result.half_life_hours).toBe(0);
    });

    it('should handle very large valid numbers from environment', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = '999999';
      process.env.BODY_HEIGHT_CM = '999999';

      const result = await getBodyProfile();

      expect(result.weight_kg).toBe(999999);
      expect(result.height_cm).toBe(999999);
    });

    it('should handle decimal values from environment', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = '75.5';
      process.env.BODY_CAFFEINE_SENSITIVITY = '1.25';

      const result = await getBodyProfile();

      expect(result.weight_kg).toBe(75.5);
      expect(result.caffeine_sensitivity).toBe(1.25);
    });

    it('should handle negative numbers from environment as valid', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Database error'));

      process.env.BODY_WEIGHT_KG = '-75';

      const result = await getBodyProfile();

      // Negative numbers are technically valid (though nonsensical)
      expect(result.weight_kg).toBe(-75);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection timeout', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('Connection timeout'));

      const result = await getBodyProfile();

      expect(result).toBeDefined();
      expect(result.weight_kg).toBe(75); // Falls back to default
    });

    it('should handle database returning undefined', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue(new Error('No profile found'));

      const result = await getBodyProfile();

      expect(result).toBeDefined();
      expect(result.weight_kg).toBe(75);
    });

    it('should handle any thrown error gracefully', async () => {
      vi.mocked(getBodyProfileDB).mockRejectedValue('String error');

      const result = await getBodyProfile();

      expect(result).toBeDefined();
      expect(result.weight_kg).toBe(75);
    });
  });
});
