import { describe, it, expect } from 'vitest';
import {
  ZDayPayload,
  ZBodyProfileUpsert,
  ZCoffee,
  ZRun,
  ZWorkoutUpsert,
  ZMonthlyGoalsUpsert,
} from './validation';

describe('validation schemas', () => {
  describe('ZDayPayload', () => {
    it('should validate valid day payload', () => {
      const validData = {
        date: '2024-01-15',
        steps: 10000,
        sleep_score: 85,
        focus_minutes: 120,
        reading_minutes: 30,
        outdoor_minutes: 45,
        writing_minutes: 60,
        coding_minutes: 240,
      };

      const result = ZDayPayload.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject negative values', () => {
      const invalidData = {
        date: '2024-01-15',
        steps: -100,
        sleep_score: 85,
      };

      const result = ZDayPayload.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept partial data (all fields optional except date)', () => {
      const minimalData = {
        date: '2024-01-15',
      };

      const result = ZDayPayload.safeParse(minimalData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        date: '01-15-2024', // Wrong format
        steps: 10000,
      };

      const result = ZDayPayload.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('ZBodyProfileUpsert', () => {
    it('should validate valid body profile', () => {
      const validData = {
        weight_kg: '70',
        height_cm: '175',
        body_fat_percentage: '15',
        muscle_percentage: '45',
        vd_l_per_kg: '0.6',
        half_life_hours: '5',
        caffeine_sensitivity: 'normal',
        bioavailability: '0.99',
        age: '30',
        sex: 'male',
        notes: 'Test notes',
      };

      const result = ZBodyProfileUpsert.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept partial profile updates', () => {
      const partialData = {
        weight_kg: '72',
        height_cm: '175',
      };

      const result = ZBodyProfileUpsert.safeParse(partialData);

      expect(result.success).toBe(true);
    });

    it('should validate caffeine_sensitivity enum', () => {
      const validSensitivities = ['low', 'normal', 'high'];

      validSensitivities.forEach((sensitivity) => {
        const data = {
          caffeine_sensitivity: sensitivity,
        };

        const result = ZBodyProfileUpsert.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid caffeine_sensitivity', () => {
      const invalidData = {
        caffeine_sensitivity: 'super-high',
      };

      const result = ZBodyProfileUpsert.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('ZCoffee', () => {
    it('should validate coffee log entry', () => {
      const validData = {
        date: new Date('2024-01-15'),
        time: '08:30',
        type: 'espresso',
        amount_ml: 200,
        coffee_cf_id: 'contentful-id-123',
      };

      const result = ZCoffee.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept optional coffee_cf_id', () => {
      const data = {
        date: new Date('2024-01-15'),
        time: '08:30',
        type: 'filter',
        amount_ml: 300,
      };

      const result = ZCoffee.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        date: new Date('2024-01-15'),
        time: '8:30', // Should be HH:mm
        type: 'espresso',
        amount_ml: 200,
      };

      const result = ZCoffee.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept alternative time formats (ISO string)', () => {
      const data = {
        date: new Date('2024-01-15'),
        time: '2024-01-15T08:30:00.000Z',
        type: 'filter',
        amount_ml: 300,
      };

      const result = ZCoffee.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('ZRun', () => {
    it('should validate run data', () => {
      const validData = {
        date: new Date('2024-01-15'),
        distance_km: 10.5,
        duration_min: 60,
        avg_pace_sec_per_km: 342, // 5:42 per km
      };

      const result = ZRun.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept optional pace', () => {
      const data = {
        date: new Date('2024-01-15'),
        distance_km: 5,
        duration_min: 30,
      };

      const result = ZRun.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const invalidData = {
        date: new Date('2024-01-15'),
        distance_km: -5,
        duration_min: 30,
      };

      const result = ZRun.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('ZWorkoutUpsert', () => {
    it('should validate workout with all fields', () => {
      const validData = {
        date: '2024-01-15',
        workout_type: 'climbing',
        duration_min: 90,
        intensity: 'high',
        perceived_effort: 8,
        details: {
          grade: '7a',
          type: 'sport',
          location: 'indoor',
        },
        notes: 'Great session',
      };

      const result = ZWorkoutUpsert.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate all workout types', () => {
      const types = ['running', 'climbing', 'bouldering', 'rowing', 'cycling', 'hiking', 'strength', 'other'];

      types.forEach((type) => {
        const data = {
          date: '2024-01-15',
          workout_type: type,
          duration_min: 60,
        };

        const result = ZWorkoutUpsert.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate all intensity levels', () => {
      const intensities = ['low', 'moderate', 'high', 'max'];

      intensities.forEach((intensity) => {
        const data = {
          date: '2024-01-15',
          workout_type: 'running',
          duration_min: 60,
          intensity,
        };

        const result = ZWorkoutUpsert.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid perceived_effort range', () => {
      const invalidData = {
        date: '2024-01-15',
        workout_type: 'running',
        duration_min: 60,
        perceived_effort: 11, // Should be 1-10
      };

      const result = ZWorkoutUpsert.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept flexible details object', () => {
      const data = {
        date: '2024-01-15',
        workout_type: 'other',
        duration_min: 45,
        details: {
          custom_field: 'custom value',
          another_field: 123,
          nested: {
            deep: 'value',
          },
        },
      };

      const result = ZWorkoutUpsert.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('ZMonthlyGoalsUpsert', () => {
    it('should validate monthly goals', () => {
      const validData = {
        running_distance_km: 100,
        steps: 300000,
        reading_minutes: 1200,
        outdoor_minutes: 600,
        writing_minutes: 400,
        coding_minutes: 4000,
        focus_minutes: 2000,
      };

      const result = ZMonthlyGoalsUpsert.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept partial goals', () => {
      const partialData = {
        running_distance_km: 50,
        steps: 150000,
      };

      const result = ZMonthlyGoalsUpsert.safeParse(partialData);

      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const invalidData = {
        running_distance_km: -10,
      };

      const result = ZMonthlyGoalsUpsert.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should coerce string numbers to numbers', () => {
      const dataWithStrings = {
        running_distance_km: '100',
        steps: '300000',
      };

      const result = ZMonthlyGoalsUpsert.safeParse(dataWithStrings);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.running_distance_km).toBe('number');
        expect(typeof result.data.steps).toBe('number');
      }
    });
  });
});
