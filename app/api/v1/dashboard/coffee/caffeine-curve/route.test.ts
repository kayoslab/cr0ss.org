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
    DASHBOARD_API_SECRET: 'test-dashboard-secret-1234567890',
  },
}));

vi.mock('@/lib/user/profile', () => ({
  getBodyProfile: vi.fn().mockResolvedValue({
    half_life_hours: 5,
    caffeine_sensitivity: 1.0,
    bioavailability: 0.9,
  }),
}));

vi.mock('@/lib/phys/caffeine', () => ({
  modelCaffeine: vi.fn().mockReturnValue([
    {
      timeISO: '2025-12-05T00:00:00.000Z',
      intake_mg: 0,
      body_mg: 25,
    },
    {
      timeISO: '2025-12-05T08:00:00.000Z',
      intake_mg: 80,
      body_mg: 85,
    },
  ]),
}));

vi.mock('@/lib/db/queries', () => ({
  qCoffeeEventsForDayWithLookback: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/time/berlin', () => ({
  startOfBerlinDayISO: vi.fn((date: Date) => '2025-12-05T00:00:00.000Z'),
  endOfBerlinDayISO: vi.fn((date: Date) => '2025-12-06T00:00:00.000Z'),
  toBerlinYMD: vi.fn((date: Date) => '2025-12-05'),
}));

import { sql } from '@/lib/db/client';

describe('GET /api/v1/dashboard/coffee/caffeine-curve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should accept valid secret', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve',
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
    it('should use today as default date', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.date).toBe('2025-12-05');
    });

    it('should accept valid date parameter', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-01',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.date).toBe('2025-12-01');
    });

    it('should return 400 for invalid date format', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=invalid',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid date parameter');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should default to 60 minute resolution', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.series).toBeDefined();
    });

    it('should accept valid resolution parameter', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?resolution=30',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should reject resolution below minimum (15)', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05&resolution=10',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid resolution parameter');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject resolution above maximum (240)', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05&resolution=300',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid resolution parameter');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Data', () => {
    it('should return correct caffeine curve structure', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        date: '2025-12-05',
        series: expect.any(Array),
        body_profile: {
          half_life_hours: 5,
          sensitivity: 1.0,
          bioavailability: 0.9,
        },
      });
    });

    it('should return series data with correct structure', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.series).toHaveLength(2);
      expect(data.series[0]).toEqual({
        time: '2025-12-05T00:00:00.000Z',
        intake_mg: 0,
        body_mg: 25,
      });
    });
  });

  describe('Cache Headers', () => {
    it('should set correct cache headers (1 minute for realtime data)', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate');
    });

    it('should set cache tags', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      const cacheTags = response.headers.get('X-Cache-Tags');
      expect(cacheTags).toContain('coffee:caffeine:2025-12-05');
      expect(cacheTags).toContain('coffee:caffeine');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // Mock qCoffeeEventsForDayWithLookback to fail (from @/lib/db/queries)
      const { qCoffeeEventsForDayWithLookback } = await import('@/lib/db/queries');
      vi.mocked(qCoffeeEventsForDayWithLookback).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/caffeine-curve?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch caffeine curve');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
