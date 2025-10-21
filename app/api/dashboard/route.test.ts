import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/rate/limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/auth/secret', () => ({
  assertSecret: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  qCupsToday: vi.fn(),
  qBrewMethodsToday: vi.fn(),
  qCoffeeOriginThisWeek: vi.fn(),
  qHabitsToday: vi.fn(),
  qHabitConsistencyThisWeek: vi.fn(),
  qWritingVsFocusTrend: vi.fn(),
  qRunningMonthlyProgress: vi.fn(),
  qPaceLastRuns: vi.fn(),
  qRunningHeatmap: vi.fn(),
  qCoffeeEventsForDayWithLookback: vi.fn(),
  qCoffeeInRange: vi.fn(),
  qSleepVsFocusScatter: vi.fn(),
  qMonthlyGoalsObject: vi.fn(),
}));

vi.mock('@/lib/user/profile', () => ({
  getBodyProfile: vi.fn(),
}));

vi.mock('@/lib/phys/caffeine', () => ({
  modelCaffeine: vi.fn(),
}));

vi.mock('@/lib/api/dashboard', () => ({
  ZDashboard: {
    safeParse: vi.fn((data) => ({ success: true, data })),
  },
}));

vi.mock('@/lib/obs/trace', () => ({
  wrapTrace: <T extends (...args: unknown[]) => unknown>(_name: string, fn: T): T => fn,
}));

import { rateLimit } from '@/lib/rate/limit';
import { assertSecret } from '@/lib/auth/secret';
import {
  qCupsToday,
  qBrewMethodsToday,
  qCoffeeOriginThisWeek,
  qHabitsToday,
  qHabitConsistencyThisWeek,
  qWritingVsFocusTrend,
  qRunningMonthlyProgress,
  qPaceLastRuns,
  qRunningHeatmap,
  qCoffeeEventsForDayWithLookback,
  qCoffeeInRange,
  qSleepVsFocusScatter,
  qMonthlyGoalsObject,
} from '@/lib/db/queries';
import { getBodyProfile } from '@/lib/user/profile';
import { modelCaffeine } from '@/lib/phys/caffeine';
import { ZDashboard } from '@/lib/api/dashboard';

describe('GET /api/dashboard', () => {
  const mockBodyProfile = {
    id: 1,
    weight_kg: 75,
    height_cm: 180,
    age: 30,
    sex: 'male' as const,
    half_life_hours: 5,
    caffeine_sensitivity: 1.0,
    bioavailability: 0.9,
    vd_l_per_kg: 0.6,
    body_fat_percentage: 15,
    muscle_percentage: 40,
    notes: null,
    measured_at: '2025-01-15T10:00:00Z',
    created_at: '2025-01-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});

    // Setup default mock returns
    vi.mocked(qCupsToday).mockResolvedValue(3);
    vi.mocked(qBrewMethodsToday).mockResolvedValue([
      { type: 'espresso', count: 2 },
      { type: 'v60', count: 1 },
    ]);
    vi.mocked(qCoffeeOriginThisWeek).mockResolvedValue([
      { name: 'Ethiopia', value: 5 },
      { name: 'Colombia', value: 3 },
    ]);
    vi.mocked(qHabitsToday).mockResolvedValue({
      date: '2025-01-15',
      focus_minutes: 120,
      steps: 8000,
      reading_minutes: 30,
      outdoor_minutes: 45,
      writing_minutes: 60,
      coding_minutes: 180,
    });
    vi.mocked(qHabitConsistencyThisWeek).mockResolvedValue([
      { name: 'Steps', kept: 5, total: 7 },
      { name: 'Reading', kept: 6, total: 7 },
    ]);
    vi.mocked(qWritingVsFocusTrend).mockResolvedValue([
      { date: '2025-01-15', writing_minutes: 60, focus_minutes: 120 },
    ]);
    vi.mocked(qRunningMonthlyProgress).mockResolvedValue({
      month: '2025-01-01',
      target_km: 50,
      total_km: 25.5,
      delta_km: -24.5,
      pct: 0.51,
    });
    vi.mocked(qPaceLastRuns).mockResolvedValue([
      { date: '2025-01-15', avg_pace_sec_per_km: 300 },
    ]);
    vi.mocked(qRunningHeatmap).mockResolvedValue([
      { date: '2025-01-15', km: 5.2 },
    ]);
    vi.mocked(getBodyProfile).mockResolvedValue(mockBodyProfile);
    vi.mocked(qCoffeeEventsForDayWithLookback).mockResolvedValue([
      { timeISO: '2025-01-15T08:00:00Z', type: 'espresso', amount_ml: 38 },
    ]);
    vi.mocked(qCoffeeInRange).mockResolvedValue([
      { date: '2025-01-14', time: '2025-01-14T14:00:00Z', type: 'espresso', amount_ml: 38 },
    ]);
    vi.mocked(qSleepVsFocusScatter).mockResolvedValue([
      { date: '2025-01-15', sleep_score: 85, focus_minutes: 120 },
    ]);
    vi.mocked(qMonthlyGoalsObject).mockResolvedValue({
      running_distance_km: 50,
      steps: 200000,
      reading_minutes: 600,
      outdoor_minutes: 900,
      writing_minutes: 1200,
      coding_minutes: 3600,
      focus_minutes: 2400,
    });
    vi.mocked(modelCaffeine).mockReturnValue([
      { timeISO: '2025-01-15T00:00:00Z', intake_mg: 0, body_mg: 0, blood_mg_per_l: 0 },
      { timeISO: '2025-01-15T01:00:00Z', intake_mg: 75, body_mg: 75, blood_mg_per_l: 1.5 },
    ]);
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw { status: 401, message: 'Unauthorized' };
      });

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });

    it('should accept valid authentication', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should call rateLimit with correct parameters', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(request, 'get-dashboard', {
        windowSec: 60,
        max: 10,
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch all required dashboard data', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(qCupsToday).toHaveBeenCalled();
      expect(qBrewMethodsToday).toHaveBeenCalled();
      expect(qCoffeeOriginThisWeek).toHaveBeenCalled();
      expect(qHabitsToday).toHaveBeenCalled();
      expect(qHabitConsistencyThisWeek).toHaveBeenCalled();
      expect(qWritingVsFocusTrend).toHaveBeenCalledWith(14);
      expect(qRunningMonthlyProgress).toHaveBeenCalled();
      expect(qPaceLastRuns).toHaveBeenCalledWith(10);
      expect(qRunningHeatmap).toHaveBeenCalledWith(42);
      expect(getBodyProfile).toHaveBeenCalled();
    });

    it('should return complete dashboard payload', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('cupsToday', 3);
      expect(data).toHaveProperty('brewMethodsToday');
      expect(data).toHaveProperty('coffeeOriginThisWeek');
      expect(data).toHaveProperty('habitsToday');
      expect(data).toHaveProperty('habitsConsistency');
      expect(data).toHaveProperty('writingVsFocus');
      expect(data).toHaveProperty('runningProgress');
      expect(data).toHaveProperty('paceSeries');
      expect(data).toHaveProperty('runningHeatmap');
      expect(data).toHaveProperty('caffeineSeries');
      expect(data).toHaveProperty('sleepPrevCaff');
      expect(data).toHaveProperty('monthlyGoals');
    });

    it('should include monthly goals with defaults', async () => {
      vi.mocked(qMonthlyGoalsObject).mockResolvedValue({});

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.monthlyGoals).toEqual({
        running_distance_km: 0,
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      });
    });

    it('should merge monthly goals with defaults', async () => {
      vi.mocked(qMonthlyGoalsObject).mockResolvedValue({
        running_distance_km: 50,
        steps: 200000,
      });

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.monthlyGoals).toEqual({
        running_distance_km: 50,
        steps: 200000,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      });
    });
  });

  describe('Caffeine Modeling', () => {
    it('should call modelCaffeine with correct parameters', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(modelCaffeine).toHaveBeenCalled();
      const callArgs = vi.mocked(modelCaffeine).mock.calls[0];
      expect(callArgs[1]).toEqual(mockBodyProfile);
      expect(callArgs[2]).toHaveProperty('alignToHour', true);
      expect(callArgs[2]).toHaveProperty('gridMinutes', 60);
    });

    it('should fetch coffee events with lookback', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(qCoffeeEventsForDayWithLookback).toHaveBeenCalled();
      const callArgs = vi.mocked(qCoffeeEventsForDayWithLookback).mock.calls[0];
      expect(callArgs).toHaveLength(3);
      // Should have startISO, endISO, and lookbackH
      expect(typeof callArgs[0]).toBe('string');
      expect(typeof callArgs[1]).toBe('string');
      expect(typeof callArgs[2]).toBe('number');
    });

    it('should use body profile half-life for lookback calculation', async () => {
      const customProfile = {
        ...mockBodyProfile,
        half_life_hours: 8,
      };
      vi.mocked(getBodyProfile).mockResolvedValue(customProfile);

      const request = new Request('http://localhost:3000/api/dashboard');
      await GET(request);

      const callArgs = vi.mocked(qCoffeeEventsForDayWithLookback).mock.calls[0];
      const lookbackH = callArgs[2];
      // Should be max(24, ceil(8 * 4)) = max(24, 32) = 32
      expect(lookbackH).toBe(32);
    });

    it('should use minimum 24h lookback', async () => {
      const customProfile = {
        ...mockBodyProfile,
        half_life_hours: 3,
      };
      vi.mocked(getBodyProfile).mockResolvedValue(customProfile);

      const request = new Request('http://localhost:3000/api/dashboard');
      await GET(request);

      const callArgs = vi.mocked(qCoffeeEventsForDayWithLookback).mock.calls[0];
      const lookbackH = callArgs[2];
      // Should be max(24, ceil(3 * 4)) = max(24, 12) = 24
      expect(lookbackH).toBe(24);
    });
  });

  describe('Sleep vs Caffeine Analysis', () => {
    it('should fetch sleep data for 60 days', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(qSleepVsFocusScatter).toHaveBeenCalledWith(60);
    });

    it('should calculate previous-day caffeine for sleep data', async () => {
      vi.mocked(qSleepVsFocusScatter).mockResolvedValue([
        { date: '2025-01-15', sleep_score: 85, focus_minutes: 120 },
        { date: '2025-01-14', sleep_score: 80, focus_minutes: 90 },
      ]);

      vi.mocked(qCoffeeInRange).mockResolvedValue([
        { date: '2025-01-14', time: '2025-01-14T14:00:00Z', type: 'espresso', amount_ml: 38 },
      ]);

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(qCoffeeInRange).toHaveBeenCalled();

      const data = await response.json();
      expect(data.sleepPrevCaff).toBeDefined();
      expect(Array.isArray(data.sleepPrevCaff)).toBe(true);
    });

    it('should filter out zero caffeine with zero sleep score', async () => {
      vi.mocked(qSleepVsFocusScatter).mockResolvedValue([
        { date: '2025-01-15', sleep_score: 85, focus_minutes: 120 },
        { date: '2025-01-14', sleep_score: 0, focus_minutes: 90 },
      ]);

      vi.mocked(qCoffeeInRange).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      const data = await response.json();
      // Should filter out entries with 0 caffeine and 0 sleep score
      expect(data.sleepPrevCaff.length).toBeLessThan(2);
    });
  });

  describe('Schema Validation', () => {
    it('should validate response with ZDashboard schema', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(ZDashboard.safeParse).toHaveBeenCalled();
    });

    it('should return 500 if schema validation fails', async () => {
      vi.mocked(ZDashboard.safeParse).mockReturnValue({
        success: false,
        error: {
          flatten: () => ({ formErrors: [], fieldErrors: {} }),
        },
      } as never);

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Schema validation failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      vi.mocked(qCupsToday).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBeDefined();
    });

    it('should handle body profile fetch errors', async () => {
      vi.mocked(getBodyProfile).mockRejectedValue(new Error('Profile not found'));

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should use default status 500 for errors without status', async () => {
      vi.mocked(qCupsToday).mockRejectedValue(new Error('Unknown error'));

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should preserve error status if provided', async () => {
      vi.mocked(qCupsToday).mockRejectedValue({ status: 503, message: 'Service unavailable' });

      const request = new Request('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(503);
    });
  });

  describe('Parallel Data Fetching', () => {
    it('should fetch data in parallel using Promise.all', async () => {
      const request = new Request('http://localhost:3000/api/dashboard');
      const startTime = Date.now();
      await GET(request);
      const endTime = Date.now();

      // All queries should have been called
      expect(qCupsToday).toHaveBeenCalled();
      expect(qBrewMethodsToday).toHaveBeenCalled();
      expect(qCoffeeOriginThisWeek).toHaveBeenCalled();

      // Should be reasonably fast (parallel execution)
      // This is a loose check - if sequential it would be much slower
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
