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

describe('GET /api/v1/dashboard/coffee/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const request = new Request('http://localhost:3000/api/v1/dashboard/coffee/summary');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should accept valid secret', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ current_date: '2025-12-05' }] as never);
      vi.mocked(sql).mockResolvedValueOnce([{ cups: 0 }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/coffee/summary', {
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
      vi.mocked(sql).mockResolvedValueOnce([{ cups: 0 }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request('http://localhost:3000/api/v1/dashboard/coffee/summary', {
        headers: {
          'x-admin-secret': 'test-dashboard-secret-1234567890',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.date).toBe('2025-12-05');
    });

    it('should accept valid date parameter', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ cups: 2 }] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { type: 'espresso', count: 2 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/summary?date=2025-12-01',
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
        'http://localhost:3000/api/v1/dashboard/coffee/summary?date=invalid',
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
    it('should return correct summary with no coffee', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ cups: 0 }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/summary?date=2025-12-05',
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
        cups: 0,
        brewMethods: [],
      });
    });

    it('should return correct summary with multiple brew methods', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ cups: 5 }] as never);
      vi.mocked(sql).mockResolvedValueOnce([
        { type: 'espresso', count: 3 },
        { type: 'v60', count: 2 },
      ] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/summary?date=2025-12-05',
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
        cups: 5,
        brewMethods: [
          { type: 'espresso', count: 3 },
          { type: 'v60', count: 2 },
        ],
      });
    });
  });

  describe('Cache Headers', () => {
    it('should set correct cache headers', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ cups: 0 }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/summary?date=2025-12-05',
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
      vi.mocked(sql).mockResolvedValueOnce([{ cups: 0 }] as never);
      vi.mocked(sql).mockResolvedValueOnce([] as never);

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/summary?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      const cacheTags = response.headers.get('X-Cache-Tags');
      expect(cacheTags).toContain('coffee:summary:2025-12-05');
      expect(cacheTags).toContain('coffee:summary');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(sql).mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new Request(
        'http://localhost:3000/api/v1/dashboard/coffee/summary?date=2025-12-05',
        {
          headers: {
            'x-admin-secret': 'test-dashboard-secret-1234567890',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch coffee summary');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
