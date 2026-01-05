import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/db/client', () => {
  const unsafeMock = vi.fn((value: unknown) => value);
  const sqlMock = Object.assign(vi.fn(), {
    // sql.unsafe needs to return a value for template literal usage
    unsafe: unsafeMock,
  });
  return {
    sql: sqlMock,
  };
});

vi.mock('@/env', () => ({
  env: {
    DASHBOARD_API_SECRET: 'test-dashboard-secret-1234567890',
  },
}));

import { sql } from '@/lib/db/client';

describe('GET /api/v1/dashboard/coffee/timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should accept valid secret', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        { period: '2025-12-01', cups_count: 2, avg_caffeine_mg: 100 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    it('should require start_date parameter', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should require end_date parameter', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid date format for start_date', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=invalid&end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid date format for end_date', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=invalid',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid query parameters');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should default to day granularity', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        { period: '2025-12-01', cups_count: 2, avg_caffeine_mg: 100 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timeline).toBeDefined();
    });

    it('should accept week granularity', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        { period: '2025-W48', cups_count: 10, avg_caffeine_mg: 105 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-31&granularity=week',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timeline).toBeDefined();
    });

    it('should accept month granularity', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        { period: '2025-12', cups_count: 50, avg_caffeine_mg: 102 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-31&granularity=month',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timeline).toBeDefined();
    });

    it('should reject invalid granularity', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05&granularity=invalid',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
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
    it('should return correct timeline with no coffee', async () => {
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        timeline: [],
        total_cups: 0,
        avg_cups_per_day: 0,
      });
    });

    it('should return correct timeline with multiple days', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        { period: '2025-12-01', cups_count: 3, avg_caffeine_mg: 100.5 },
        { period: '2025-12-02', cups_count: 2, avg_caffeine_mg: 95.3 },
        { period: '2025-12-03', cups_count: 4, avg_caffeine_mg: 110.7 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-03',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.timeline).toHaveLength(3);
      expect(data.timeline[0]).toEqual({
        period: '2025-12-01',
        cups_count: 3,
        avg_caffeine_mg: 101, // rounded
      });
      expect(data.total_cups).toBe(9);
      expect(data.avg_cups_per_day).toBe(3);
    });

    it('should calculate correct avg_cups_per_day', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        { period: '2025-12-01', cups_count: 2, avg_caffeine_mg: 100 },
        { period: '2025-12-02', cups_count: 3, avg_caffeine_mg: 95 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      // 5 total cups over 5 days = 1 cup/day
      expect(data.total_cups).toBe(5);
      expect(data.avg_cups_per_day).toBe(1);
    });
  });

  describe('Cache Headers', () => {
    it('should set correct cache headers', async () => {
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=300');
      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate');
    });

    it('should set cache tags', async () => {
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05&granularity=day',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      const cacheTags = response.headers.get('X-Cache-Tags');
      expect(cacheTags).toContain('coffee:timeline');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(sql).mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/timeline?start_date=2025-12-01&end_date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch coffee timeline');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
