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

import { sql } from '@/lib/db/client';

describe('GET /api/v1/dashboard/habits/today', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const request = new Request('http://localhost:3000/api/v1/dashboard/habits/today');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should accept valid secret', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/habits/today', {
        headers: {
          'x-admin-secret': 'test-dashboard-secret-1234567890',
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    it('should use today as default date', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/habits/today', {
        headers: {
          'x-admin-secret': 'test-dashboard-secret-1234567890',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.date).toBe('2025-12-05');
    });

    it('should accept valid date parameter', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        {
          date: '2025-12-01',
          steps: 12500,
          reading_minutes: 45,
          outdoor_minutes: 60,
          writing_minutes: 90,
          coding_minutes: 240,
          focus_minutes: 180,
          sleep_score: 85,
        },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/habits/today?date=2025-12-01',
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
        'http://localhost:3000/api/v1/dashboard/habits/today?date=invalid',
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
    it('should return zeros when no data exists', async () => {
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/habits/today?date=2025-12-05',
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
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      });
    });

    it('should return correct habits data', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        {
          date: '2025-12-05',
          steps: 12500,
          reading_minutes: 45,
          outdoor_minutes: 60,
          writing_minutes: 90,
          coding_minutes: 240,
          focus_minutes: 180,
          sleep_score: 85,
        },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/habits/today?date=2025-12-05',
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
        steps: 12500,
        reading_minutes: 45,
        outdoor_minutes: 60,
        writing_minutes: 90,
        coding_minutes: 240,
        focus_minutes: 180,
        sleep_score: 85,
      });
    });

    it('should handle missing sleep_score', async () => {
      vi.mocked(sql).mockResolvedValueOnce([
        {
          date: '2025-12-05',
          steps: 10000,
          reading_minutes: 30,
          outdoor_minutes: 30,
          writing_minutes: 60,
          coding_minutes: 120,
          focus_minutes: 90,
          sleep_score: null,
        },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/habits/today?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.sleep_score).toBeUndefined();
    });
  });

  describe('Cache Headers', () => {
    it('should set correct cache headers (30 seconds for realtime data)', async () => {
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/habits/today?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=30');
      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate');
    });

    it('should set cache tags', async () => {
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/habits/today?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      const cacheTags = response.headers.get('X-Cache-Tags');
      expect(cacheTags).toContain('habits:today:2025-12-05');
      expect(cacheTags).toContain('habits:today');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(sql).mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/habits/today?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch habits data');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
