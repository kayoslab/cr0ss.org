import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/db/client', () => {
  const sqlMock = vi.fn();
  return {
    sql: sqlMock,
  };
});

vi.mock('@/env', () => ({
  env: {
    DASHBOARD_API_SECRET: 'test-secret',
  },
}));

import { sql } from '@/lib/db/client';

describe('GET /api/v1/dashboard/workouts/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should accept valid secret', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    it('should default to month period', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe('month');
    });

    it('should accept today period', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/workouts/summary?period=today',
        {
          headers: {
            'x-admin-secret': 'test-secret',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe('today');
    });

    it('should accept week period', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ week_start: '2025-11-29' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/workouts/summary?period=week',
        {
          headers: {
            'x-admin-secret': 'test-secret',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe('week');
    });

    it('should return 400 for invalid period', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/workouts/summary?period=invalid',
        {
          headers: {
            'x-admin-secret': 'test-secret',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Data', () => {
    it('should return correct summary with no workouts', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        period: 'month',
        workout_types: [],
        total_workouts: 0,
        total_duration_min: 0,
        streaks: {
          current: 0,
          longest: 0,
        },
      });
    });

    it('should return correct summary with workouts', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { type: 'running', count: 5, total_duration_min: 250, avg_duration_min: 50 },
        { type: 'climbing', count: 2, total_duration_min: 120, avg_duration_min: 60 },
      ] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { date: new Date('2025-12-05'), days_diff: null },
        { date: new Date('2025-12-04'), days_diff: 1 },
        { date: new Date('2025-12-02'), days_diff: 2 },
      ] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.workout_types).toHaveLength(2);
      expect(data.total_workouts).toBe(7);
      expect(data.total_duration_min).toBe(370);
      expect(data.streaks.current).toBeGreaterThan(0);
      expect(data.streaks.longest).toBeGreaterThan(0);
    });

    it('should calculate current streak correctly', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { date: new Date('2025-12-05'), days_diff: null },
      ] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      // Current streak: Most recent workout has days_diff: null, which counts as 1 and breaks
      expect(data.streaks.current).toBe(1);
      expect(data.streaks.longest).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cache Headers', () => {
    it('should set correct cache headers', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate');
    });

    it('should set cache tags', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      const cacheTags = response.headers.get('X-Cache-Tags');
      expect(cacheTags).toContain('workouts:summary:month');
      expect(cacheTags).toContain('workouts:summary');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(sql).mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/v1/dashboard/workouts/summary', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch workouts summary');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
