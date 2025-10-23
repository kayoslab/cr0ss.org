import { describe, it, expect } from 'vitest';
import {
  ZBrewMethodToday,
  ZNameValue,
  ZHabitsToday,
  ZConsistency,
  ZWritingVsFocus,
  ZRunningProgress,
  ZPacePoint,
  ZHeat,
  ZCaffeinePoint,
  ZSleepPrev,
  ZMonthlyGoals,
  ZDashboard,
} from './dashboard';

describe('Dashboard Zod Schemas', () => {
  describe('ZBrewMethodToday', () => {
    it('should validate valid brew method', () => {
      const valid = { type: 'espresso', count: 2 };
      expect(ZBrewMethodToday.parse(valid)).toEqual(valid);
    });

    it('should reject invalid brew method', () => {
      expect(() => ZBrewMethodToday.parse({ type: 'espresso' })).toThrow();
      expect(() => ZBrewMethodToday.parse({ count: 2 })).toThrow();
      expect(() => ZBrewMethodToday.parse({ type: 123, count: 2 })).toThrow();
    });
  });

  describe('ZNameValue', () => {
    it('should validate valid name-value pair', () => {
      const valid = { name: 'Ethiopia', value: 5 };
      expect(ZNameValue.parse(valid)).toEqual(valid);
    });

    it('should reject invalid name-value pair', () => {
      expect(() => ZNameValue.parse({ name: 'Ethiopia' })).toThrow();
      expect(() => ZNameValue.parse({ value: 5 })).toThrow();
      expect(() => ZNameValue.parse({ name: 123, value: 5 })).toThrow();
    });
  });

  describe('ZHabitsToday', () => {
    it('should validate valid habits data', () => {
      const valid = {
        steps: 10000,
        reading_minutes: 30,
        outdoor_minutes: 60,
        writing_minutes: 45,
        coding_minutes: 120,
        focus_minutes: 90,
      };
      expect(ZHabitsToday.parse(valid)).toEqual(valid);
    });

    it('should reject missing fields', () => {
      expect(() => ZHabitsToday.parse({ steps: 10000 })).toThrow();
    });

    it('should reject invalid types', () => {
      const invalid = {
        steps: '10000',
        reading_minutes: 30,
        outdoor_minutes: 60,
        writing_minutes: 45,
        coding_minutes: 120,
        focus_minutes: 90,
      };
      expect(() => ZHabitsToday.parse(invalid)).toThrow();
    });

    it('should accept zero values', () => {
      const valid = {
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      };
      expect(ZHabitsToday.parse(valid)).toEqual(valid);
    });
  });

  describe('ZConsistency', () => {
    it('should validate valid consistency data', () => {
      const valid = { name: 'Reading', kept: 5, total: 7 };
      expect(ZConsistency.parse(valid)).toEqual(valid);
    });

    it('should reject invalid consistency data', () => {
      expect(() => ZConsistency.parse({ name: 'Reading', kept: 5 })).toThrow();
      expect(() => ZConsistency.parse({ kept: 5, total: 7 })).toThrow();
    });
  });

  describe('ZWritingVsFocus', () => {
    it('should validate valid writing vs focus data', () => {
      const valid = {
        date: '2025-10-23',
        writing_minutes: 45,
        focus_minutes: 90,
      };
      expect(ZWritingVsFocus.parse(valid)).toEqual(valid);
    });

    it('should accept any date string format', () => {
      const valid = {
        date: '2025-10-23',
        writing_minutes: 45,
        focus_minutes: 90,
      };
      expect(ZWritingVsFocus.parse(valid)).toEqual(valid);
    });

    it('should reject missing fields', () => {
      expect(() => ZWritingVsFocus.parse({ date: '2025-10-23' })).toThrow();
    });
  });

  describe('ZRunningProgress', () => {
    it('should validate valid running progress', () => {
      const valid = {
        target_km: 50,
        total_km: 35,
        delta_km: -15,
        pct: 70,
        month: '2025-10-01',
      };
      expect(ZRunningProgress.parse(valid)).toEqual(valid);
    });

    it('should accept negative delta', () => {
      const valid = {
        target_km: 50,
        total_km: 60,
        delta_km: 10,
        pct: 120,
        month: '2025-10-01',
      };
      expect(ZRunningProgress.parse(valid)).toEqual(valid);
    });

    it('should reject missing fields', () => {
      expect(() =>
        ZRunningProgress.parse({
          target_km: 50,
          total_km: 35,
          delta_km: -15,
        })
      ).toThrow();
    });
  });

  describe('ZPacePoint', () => {
    it('should validate valid pace point', () => {
      const valid = {
        date: '2025-10-23',
        avg_pace_sec_per_km: 300,
      };
      expect(ZPacePoint.parse(valid)).toEqual(valid);
    });

    it('should accept decimal pace values', () => {
      const valid = {
        date: '2025-10-23',
        avg_pace_sec_per_km: 305.5,
      };
      expect(ZPacePoint.parse(valid)).toEqual(valid);
    });

    it('should reject missing fields', () => {
      expect(() => ZPacePoint.parse({ date: '2025-10-23' })).toThrow();
    });
  });

  describe('ZHeat', () => {
    it('should validate valid heat data', () => {
      const valid = { date: '2025-10-23', km: 5.5 };
      expect(ZHeat.parse(valid)).toEqual(valid);
    });

    it('should accept zero km', () => {
      const valid = { date: '2025-10-23', km: 0 };
      expect(ZHeat.parse(valid)).toEqual(valid);
    });

    it('should reject missing fields', () => {
      expect(() => ZHeat.parse({ date: '2025-10-23' })).toThrow();
    });
  });

  describe('ZCaffeinePoint', () => {
    it('should validate valid caffeine point', () => {
      const valid = {
        timeISO: '2025-10-23T08:00:00Z',
        intake_mg: 95,
        body_mg: 50,
      };
      expect(ZCaffeinePoint.parse(valid)).toEqual(valid);
    });

    it('should accept zero values', () => {
      const valid = {
        timeISO: '2025-10-23T08:00:00Z',
        intake_mg: 0,
        body_mg: 0,
      };
      expect(ZCaffeinePoint.parse(valid)).toEqual(valid);
    });

    it('should reject invalid ISO string type', () => {
      expect(() =>
        ZCaffeinePoint.parse({
          timeISO: 1234567890,
          intake_mg: 95,
          body_mg: 50,
        })
      ).toThrow();
    });
  });

  describe('ZSleepPrev', () => {
    it('should validate valid sleep data', () => {
      const valid = {
        date: '2025-10-23',
        sleep_score: 85,
        prev_caffeine_mg: 50,
      };
      expect(ZSleepPrev.parse(valid)).toEqual(valid);
    });

    it('should accept zero caffeine', () => {
      const valid = {
        date: '2025-10-23',
        sleep_score: 85,
        prev_caffeine_mg: 0,
      };
      expect(ZSleepPrev.parse(valid)).toEqual(valid);
    });

    it('should reject missing fields', () => {
      expect(() =>
        ZSleepPrev.parse({ date: '2025-10-23', sleep_score: 85 })
      ).toThrow();
    });
  });

  describe('ZMonthlyGoals', () => {
    it('should validate valid monthly goals', () => {
      const valid = {
        steps: 10000,
        running_distance_km: 50,
        reading_minutes: 300,
        outdoor_minutes: 600,
        writing_minutes: 400,
        coding_minutes: 1200,
        focus_minutes: 900,
      };
      expect(ZMonthlyGoals.parse(valid)).toEqual(valid);
    });

    it('should use default values when not provided', () => {
      const result = ZMonthlyGoals.parse({});
      expect(result).toEqual({
        steps: 0,
        running_distance_km: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      });
    });

    it('should use default for missing individual fields', () => {
      const partial = { steps: 10000 };
      const result = ZMonthlyGoals.parse(partial);
      expect(result.steps).toBe(10000);
      expect(result.running_distance_km).toBe(0);
    });

    it('should accept zero values', () => {
      const valid = {
        steps: 0,
        running_distance_km: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      };
      expect(ZMonthlyGoals.parse(valid)).toEqual(valid);
    });
  });

  describe('ZDashboard', () => {
    it('should validate complete dashboard data', () => {
      const valid = {
        cupsToday: 2,
        brewMethodsToday: [
          { type: 'espresso', count: 1 },
          { type: 'filter', count: 1 },
        ],
        coffeeOriginThisWeek: [
          { name: 'Ethiopia', value: 3 },
          { name: 'Colombia', value: 2 },
        ],
        habitsToday: {
          steps: 10000,
          reading_minutes: 30,
          outdoor_minutes: 60,
          writing_minutes: 45,
          coding_minutes: 120,
          focus_minutes: 90,
        },
        habitsConsistency: [{ name: 'Reading', kept: 5, total: 7 }],
        writingVsFocus: [
          { date: '2025-10-23', writing_minutes: 45, focus_minutes: 90 },
        ],
        runningProgress: {
          target_km: 50,
          total_km: 35,
          delta_km: -15,
          pct: 70,
          month: '2025-10-01',
        },
        paceSeries: [{ date: '2025-10-23', avg_pace_sec_per_km: 300 }],
        runningHeatmap: [{ date: '2025-10-23', km: 5.5 }],
        caffeineSeries: [
          {
            timeISO: '2025-10-23T08:00:00Z',
            intake_mg: 95,
            body_mg: 50,
          },
        ],
        sleepPrevCaff: [
          {
            date: '2025-10-23',
            sleep_score: 85,
            prev_caffeine_mg: 50,
          },
        ],
        monthlyGoals: {
          steps: 10000,
          running_distance_km: 50,
          reading_minutes: 300,
          outdoor_minutes: 600,
          writing_minutes: 400,
          coding_minutes: 1200,
          focus_minutes: 900,
        },
      };

      const result = ZDashboard.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should accept empty arrays', () => {
      const valid = {
        cupsToday: 0,
        brewMethodsToday: [],
        coffeeOriginThisWeek: [],
        habitsToday: {
          steps: 0,
          reading_minutes: 0,
          outdoor_minutes: 0,
          writing_minutes: 0,
          coding_minutes: 0,
          focus_minutes: 0,
        },
        habitsConsistency: [],
        writingVsFocus: [],
        runningProgress: {
          target_km: 50,
          total_km: 0,
          delta_km: -50,
          pct: 0,
          month: '2025-10-01',
        },
        paceSeries: [],
        runningHeatmap: [],
        caffeineSeries: [],
        sleepPrevCaff: [],
        monthlyGoals: {
          steps: 0,
          running_distance_km: 0,
          reading_minutes: 0,
          outdoor_minutes: 0,
          writing_minutes: 0,
          coding_minutes: 0,
          focus_minutes: 0,
        },
      };

      expect(ZDashboard.parse(valid)).toEqual(valid);
    });

    it('should reject missing required fields', () => {
      const invalid = {
        cupsToday: 2,
        brewMethodsToday: [],
        // missing other required fields
      };
      expect(() => ZDashboard.parse(invalid)).toThrow();
    });

    it('should reject invalid nested objects', () => {
      const invalid = {
        cupsToday: 2,
        brewMethodsToday: [{ type: 'espresso' }], // missing count
        coffeeOriginThisWeek: [],
        habitsToday: {
          steps: 0,
          reading_minutes: 0,
          outdoor_minutes: 0,
          writing_minutes: 0,
          coding_minutes: 0,
          focus_minutes: 0,
        },
        habitsConsistency: [],
        writingVsFocus: [],
        runningProgress: {
          target_km: 50,
          total_km: 0,
          delta_km: -50,
          pct: 0,
          month: '2025-10-01',
        },
        paceSeries: [],
        runningHeatmap: [],
        caffeineSeries: [],
        sleepPrevCaff: [],
        monthlyGoals: {
          steps: 0,
          running_distance_km: 0,
          reading_minutes: 0,
          outdoor_minutes: 0,
          writing_minutes: 0,
          coding_minutes: 0,
          focus_minutes: 0,
        },
      };
      expect(() => ZDashboard.parse(invalid)).toThrow();
    });
  });
});
