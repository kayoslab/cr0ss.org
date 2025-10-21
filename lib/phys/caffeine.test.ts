import { describe, it, expect } from 'vitest';
import {
  modelCaffeine,
  estimateIntakeMgFor,
  DEFAULT_MG_PER_ML,
  DEFAULT_SHOT_ML,
  type BrewEvent,
} from './caffeine';
import type { BodyProfile } from '@/lib/user/profile';

describe('caffeine modeling', () => {
  const baseBody: BodyProfile = {
    weight_kg: 70,
    height_cm: 175,
    half_life_hours: 5,
    vd_l_per_kg: 0.6,
    caffeine_sensitivity: 1.0,
    bioavailability: 0.99,
    age: 30,
    sex: 'male',
    body_fat_percentage: null,
    muscle_percentage: null,
  };

  describe('modelCaffeine', () => {
    describe('basic functionality', () => {
      it('should return empty array for empty events with no grid points', () => {
        const result = modelCaffeine([], baseBody, {
          startMs: 0,
          endMs: 0,
          gridMinutes: 60,
        });

        expect(result).toEqual([]);
      });

      it('should return zero caffeine for empty events array', () => {
        const startMs = Date.parse('2024-01-15T08:00:00Z');
        const endMs = Date.parse('2024-01-15T09:00:00Z');

        const result = modelCaffeine([], baseBody, {
          startMs,
          endMs,
          gridMinutes: 60,
        });

        expect(result).toHaveLength(1);
        expect(result[0].body_mg).toBe(0);
        expect(result[0].intake_mg).toBe(0);
        expect(result[0].blood_mg_per_l).toBe(0);
      });

      it('should calculate caffeine decay over time', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const startMs = Date.parse('2024-01-15T08:00:00Z');
        const endMs = Date.parse('2024-01-15T14:00:00Z');

        const result = modelCaffeine(events, baseBody, {
          startMs,
          endMs,
          gridMinutes: 60,
        });

        expect(result).toHaveLength(6);

        // Verify decay: each point should have less caffeine than the previous
        for (let i = 1; i < result.length; i++) {
          expect(result[i].body_mg).toBeLessThan(result[i - 1].body_mg);
        }

        // All values should be non-negative
        expect(result.every((p) => p.body_mg >= 0)).toBe(true);
      });

      it('should accumulate multiple doses', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
          {
            timeISO: '2024-01-15T10:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const startMs = Date.parse('2024-01-15T08:00:00Z');
        const endMs = Date.parse('2024-01-15T14:00:00Z');

        const result = modelCaffeine(events, baseBody, {
          startMs,
          endMs,
          gridMinutes: 60,
        });

        // At 10:00, should have second dose plus decayed first dose
        const at10 = result.find((p) => p.timeISO === '2024-01-15T10:00:00.000Z');
        expect(at10).toBeDefined();
        expect(at10!.body_mg).toBeGreaterThan(0);

        // Check that intake is recorded
        expect(at10!.intake_mg).toBeGreaterThan(0);
      });
    });

    describe('dose calculation', () => {
      it('should use explicit mg when provided', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            mg: 100,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        const firstPoint = result[0];
        expect(firstPoint.intake_mg).toBeGreaterThan(0);
        expect(firstPoint.body_mg).toBeGreaterThan(0);
      });

      it('should calculate from amount_ml when mg not provided', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        const firstPoint = result[0];
        // espresso: 38ml * 2.1 mg/ml * 0.99 bioavailability * 1.0 sensitivity
        const expectedDose = Math.round(38 * 2.1 * 0.99 * 1.0);
        expect(firstPoint.intake_mg).toBeCloseTo(expectedDose, 0);
      });

      it('should use fallback defaults when amount_ml missing', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        const firstPoint = result[0];
        expect(firstPoint.intake_mg).toBeGreaterThan(0);
      });

      it('should apply sensitivity multiplier', () => {
        const highSensitivityBody: BodyProfile = {
          ...baseBody,
          caffeine_sensitivity: 2.0,
        };

        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const normalResult = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        const highSensResult = modelCaffeine(events, highSensitivityBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // High sensitivity should result in ~2x dose
        expect(highSensResult[0].intake_mg).toBeCloseTo(
          normalResult[0].intake_mg * 2,
          0
        );
      });

      it('should apply bioavailability factor', () => {
        const lowBioBody: BodyProfile = {
          ...baseBody,
          bioavailability: 0.5,
        };

        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const normalResult = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        const lowBioResult = modelCaffeine(events, lowBioBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // Low bioavailability should reduce dose
        expect(lowBioResult[0].intake_mg).toBeLessThan(normalResult[0].intake_mg);
      });
    });

    describe('volume of distribution (Vd)', () => {
      it('should use lean body mass when body fat percentage available', () => {
        const bodyWithFat: BodyProfile = {
          ...baseBody,
          weight_kg: 80,
          body_fat_percentage: 20, // 20% body fat = 64kg lean mass
        };

        const bodyWithoutFat: BodyProfile = {
          ...baseBody,
          weight_kg: 80,
          body_fat_percentage: null,
        };

        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const opts = {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        };

        const withFatResult = modelCaffeine(events, bodyWithFat, opts);
        const withoutFatResult = modelCaffeine(events, bodyWithoutFat, opts);

        // With body fat data, concentration should be higher (smaller Vd)
        expect(withFatResult[0].blood_mg_per_l).toBeGreaterThan(
          withoutFatResult[0].blood_mg_per_l
        );
      });

      it('should handle custom vd_l_per_kg', () => {
        const customVdBody: BodyProfile = {
          ...baseBody,
          vd_l_per_kg: 0.8, // Higher than default 0.6
        };

        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const normalResult = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        const customVdResult = modelCaffeine(events, customVdBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // Higher Vd = lower concentration
        expect(customVdResult[0].blood_mg_per_l).toBeLessThan(
          normalResult[0].blood_mg_per_l
        );
      });
    });

    describe('half-life variations', () => {
      it('should use custom half-life from options', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const fastMetabolism = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T14:00:00Z'),
          gridMinutes: 60,
          halfLifeHours: 3,
        });

        const slowMetabolism = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T14:00:00Z'),
          gridMinutes: 60,
          halfLifeHours: 7,
        });

        // After 6 hours, fast metabolism should have less remaining
        const fastAt14 = fastMetabolism[fastMetabolism.length - 1];
        const slowAt14 = slowMetabolism[slowMetabolism.length - 1];

        expect(fastAt14.body_mg).toBeLessThan(slowAt14.body_mg);
      });

      it('should use body profile half-life when option not provided', () => {
        const fastMetabolismBody: BodyProfile = {
          ...baseBody,
          half_life_hours: 3,
        };

        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, fastMetabolismBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T14:00:00Z'),
          gridMinutes: 60,
        });

        // Should show faster decay - after 6 hours with 3h half-life, ~25% should remain
        expect(result[result.length - 1].body_mg).toBeLessThan(
          result[0].body_mg * 0.5
        );
      });
    });

    describe('grid and time windowing', () => {
      it('should respect custom grid resolution', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const hourly = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T10:00:00Z'),
          gridMinutes: 60,
        });

        const fifteenMin = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T10:00:00Z'),
          gridMinutes: 15,
        });

        expect(hourly.length).toBe(2); // 8:00, 9:00
        expect(fifteenMin.length).toBe(8); // Every 15 minutes
      });

      it('should filter events outside time window', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T07:00:00Z', // Before window
            type: 'espresso',
            amount_ml: 38,
          },
          {
            timeISO: '2024-01-15T08:00:00Z', // In window
            type: 'espresso',
            amount_ml: 38,
          },
          {
            timeISO: '2024-01-15T11:00:00Z', // After window
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T10:00:00Z'),
          gridMinutes: 60,
        });

        // Should only show intake at 8:00
        const intakePoints = result.filter((p) => p.intake_mg > 0);
        expect(intakePoints).toHaveLength(1);
        expect(intakePoints[0].timeISO).toBe('2024-01-15T08:00:00.000Z');
      });

      it('should include residual caffeine from events before window', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T06:00:00Z', // 2 hours before window
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // Should have caffeine in body from earlier dose
        expect(result[0].body_mg).toBeGreaterThan(0);
        // But no intake during this window
        expect(result[0].intake_mg).toBe(0);
      });

      it('should align to hour when alignToHour is true', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:30:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:15:00Z'),
          endMs: Date.parse('2024-01-15T10:45:00Z'),
          alignToHour: true,
        });

        // Times should be aligned to hour boundaries
        result.forEach((point) => {
          const date = new Date(point.timeISO);
          const minutes = date.getUTCMinutes();
          expect(minutes).toBe(0);
        });
      });
    });

    describe('different brew types', () => {
      it('should handle espresso correctly', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        expect(result[0].intake_mg).toBeGreaterThan(50);
      });

      it('should handle v60 with larger volume', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'v60',
            amount_ml: 250,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // v60: 250ml * 0.8 mg/ml = 200mg * bioavailability
        expect(result[0].intake_mg).toBeGreaterThan(150);
      });

      it('should handle custom brew types with fallback', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'unknown_type',
            amount_ml: 200,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // Should use 'other' fallback values
        expect(result[0].intake_mg).toBeGreaterThan(0);
      });

      it('should handle custom mgPerMl override', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
          mgPerMl: {
            espresso: 3.0, // Higher than default 2.1
          },
        });

        // Should use custom concentration
        const expectedDose = Math.round(38 * 3.0 * 0.99 * 1.0);
        expect(result[0].intake_mg).toBeCloseTo(expectedDose, 0);
      });
    });

    describe('edge cases', () => {
      it('should handle events with null/undefined timeISO', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '',
            type: 'espresso',
            amount_ml: 38,
          },
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // Should only process valid event
        expect(result[0].intake_mg).toBeGreaterThan(0);
      });

      it('should handle zero weight with fallback', () => {
        const zeroWeightBody: BodyProfile = {
          ...baseBody,
          weight_kg: 0,
        };

        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, zeroWeightBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // Should use fallback weight and calculate concentration
        expect(result[0].blood_mg_per_l).toBeGreaterThan(0);
      });

      it('should handle very low body weight with minimum Vd', () => {
        const lowWeightBody: BodyProfile = {
          ...baseBody,
          weight_kg: 20,
        };

        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, lowWeightBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T09:00:00Z'),
          gridMinutes: 60,
        });

        // Vd should be at least 1L (clamped at minimum)
        expect(result[0].blood_mg_per_l).toBeGreaterThan(0);
        expect(result[0].blood_mg_per_l).toBeLessThan(10000); // Reasonable upper bound
      });

      it('should sort unsorted events chronologically', () => {
        const events: BrewEvent[] = [
          {
            timeISO: '2024-01-15T10:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
          {
            timeISO: '2024-01-15T08:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
          {
            timeISO: '2024-01-15T09:00:00Z',
            type: 'espresso',
            amount_ml: 38,
          },
        ];

        const result = modelCaffeine(events, baseBody, {
          startMs: Date.parse('2024-01-15T08:00:00Z'),
          endMs: Date.parse('2024-01-15T11:00:00Z'),
          gridMinutes: 60,
        });

        // Should have intake at all three hours
        const intakePoints = result.filter((p) => p.intake_mg > 0);
        expect(intakePoints).toHaveLength(3);
      });
    });
  });

  describe('estimateIntakeMgFor', () => {
    it('should calculate espresso intake correctly', () => {
      const result = estimateIntakeMgFor('espresso', 38);

      // Default: 80mg @ 38ml
      expect(result).toBeCloseTo(80, 0);
    });

    it('should scale with volume', () => {
      const single = estimateIntakeMgFor('espresso', 38);
      const double = estimateIntakeMgFor('espresso', 76);

      expect(double).toBeCloseTo(single * 2, 0);
    });

    it('should handle different brew types', () => {
      expect(estimateIntakeMgFor('v60', 250)).toBeCloseTo(120, 0);
      expect(estimateIntakeMgFor('chemex', 300)).toBeCloseTo(200, 0);
      expect(estimateIntakeMgFor('moka', 60)).toBeCloseTo(100, 0);
      expect(estimateIntakeMgFor('cold_brew', 250)).toBeCloseTo(150, 0);
    });

    it('should use fallback for unknown types', () => {
      const result = estimateIntakeMgFor('unknown', 200);

      // Should use 'other' defaults
      expect(result).toBeGreaterThan(0);
    });

    it('should handle zero volume', () => {
      const result = estimateIntakeMgFor('espresso', 0);

      // Should use default volume
      expect(result).toBeGreaterThan(0);
    });

    it('should handle negative volume', () => {
      const result = estimateIntakeMgFor('espresso', -100);

      // Math.max(0, Number(-100) || base.ml) = Math.max(0, -100 || 38) = Math.max(0, -100) = 0
      // So result will be 0 mg
      expect(result).toBe(0);
    });

    it('should return one decimal place precision', () => {
      const result = estimateIntakeMgFor('v60', 123);

      // Check it's a number with at most 1 decimal place
      expect(result).toBe(Number(result.toFixed(1)));
    });
  });

  describe('constants', () => {
    it('should export DEFAULT_MG_PER_ML', () => {
      expect(DEFAULT_MG_PER_ML).toBeDefined();
      expect(DEFAULT_MG_PER_ML.espresso).toBe(2.1);
      expect(DEFAULT_MG_PER_ML.v60).toBe(0.8);
    });

    it('should export DEFAULT_SHOT_ML', () => {
      expect(DEFAULT_SHOT_ML).toBeDefined();
      expect(DEFAULT_SHOT_ML.espresso).toBe(38);
      expect(DEFAULT_SHOT_ML.v60).toBe(250);
    });
  });
});
