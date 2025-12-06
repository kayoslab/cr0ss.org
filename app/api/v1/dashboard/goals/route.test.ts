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

describe('GET /api/v1/dashboard/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const request = new Request('http://localhost:3000/api/v1/dashboard/goals');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should accept valid secret', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Response Data', () => {
    it('should return empty goals when none exist', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        daily: {},
        monthly: {},
      });
    });

    it('should return daily and monthly goals', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { kind: 'steps', target: 10000, period: 'daily' },
        { kind: 'reading_minutes', target: 30, period: 'daily' },
        { kind: 'outdoor_minutes', target: 30, period: 'daily' },
        { kind: 'writing_minutes', target: 60, period: 'daily' },
        { kind: 'coding_minutes', target: 120, period: 'daily' },
        { kind: 'focus_minutes', target: 180, period: 'daily' },
        { kind: 'running_distance_km', target: 100, period: 'monthly' },
      ] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        daily: {
          steps: 10000,
          reading_minutes: 30,
          outdoor_minutes: 30,
          writing_minutes: 60,
          coding_minutes: 120,
          focus_minutes: 180,
        },
        monthly: {
          running_distance_km: 100,
        },
      });
    });

    it('should only return daily goals when no monthly goals exist', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { kind: 'steps', target: 10000, period: 'daily' },
        { kind: 'reading_minutes', target: 30, period: 'daily' },
      ] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.daily).toEqual({
        steps: 10000,
        reading_minutes: 30,
      });
      expect(data.monthly).toEqual({});
    });

    it('should only return monthly goals when no daily goals exist', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { kind: 'running_distance_km', target: 100, period: 'monthly' },
        { kind: 'climbing_sessions', target: 8, period: 'monthly' },
      ] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.daily).toEqual({});
      expect(data.monthly).toEqual({
        running_distance_km: 100,
        climbing_sessions: 8,
      });
    });
  });

  describe('Cache Headers', () => {
    it('should set correct cache headers (10 minutes for stable data)', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=600');
      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate');
    });

    it('should set cache tags', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-12-01' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      const cacheTags = response.headers.get('X-Cache-Tags');
      expect(cacheTags).toContain('goals:goals');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(sql).mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/v1/dashboard/goals', {
        headers: {
          'x-admin-secret': 'test-secret',
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch goals');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
