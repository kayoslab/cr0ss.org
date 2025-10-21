import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';

// Mock dependencies
vi.mock('@/lib/rate/limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/auth/secret', () => ({
  assertSecret: vi.fn(),
}));

vi.mock('@/lib/db/client', () => {
  const sqlMock = vi.fn(() => {
    // Return a promise by default
    return Promise.resolve([{ d: '2025-01-01' }]);
  });
  // Add unsafe as a property
  Object.assign(sqlMock, {
    unsafe: vi.fn((query: string) => query),
  });

  return {
    sql: sqlMock,
  };
});

vi.mock('@/lib/cache/revalidate', () => ({
  revalidateDashboard: vi.fn(),
}));

vi.mock('@/lib/obs/trace', () => ({
  wrapTrace: <T extends (...args: unknown[]) => unknown>(_name: string, fn: T): T => fn,
}));

import { rateLimit } from '@/lib/rate/limit';
import { assertSecret } from '@/lib/auth/secret';
import { sql } from '@/lib/db/client';
import { revalidateDashboard } from '@/lib/cache/revalidate';

describe('GET /api/habits/day', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw { status: 401, message: 'Unauthorized' };
      });

      const request = new Request('http://localhost:3000/api/habits/day');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

      const request = new Request('http://localhost:3000/api/habits/day');
      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('should call rateLimit with correct parameters', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ d: '2025-01-15' }]);
      vi.mocked(sql).mockResolvedValueOnce([]);

      const request = new Request('http://localhost:3000/api/habits/day');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(
        request,
        'get-day',
        { windowSec: 60, max: 10 }
      );
    });
  });

  describe('Date Parameter', () => {
    it('should use provided date parameter', async () => {
      vi.mocked(sql).mockResolvedValue([{
        date: '2025-01-15',
        sleep_score: 8,
        focus_minutes: 120,
        steps: 10000,
        reading_minutes: 30,
        outdoor_minutes: 60,
        writing_minutes: 45,
        coding_minutes: 180,
      }]);

      const request = new Request('http://localhost:3000/api/habits/day?date=2025-01-15');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.date).toBe('2025-01-15');
    });

    it('should return zero values when no data exists for date', async () => {
      vi.mocked(sql).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/habits/day?date=2025-01-20');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        date: '2025-01-20',
        sleep_score: 0,
        focus_minutes: 0,
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
      });
    });
  });
});

describe('POST /api/habits/day', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
    vi.mocked(revalidateDashboard).mockImplementation(() => {});
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw { status: 401, message: 'Unauthorized' };
      });

      const request = new Request('http://localhost:3000/api/habits/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', sleep_score: 8 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

      const request = new Request('http://localhost:3000/api/habits/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid date format', async () => {
      const request = new Request('http://localhost:3000/api/habits/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: 'invalid-date', sleep_score: 8 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
      expect(data.errors).toBeDefined();
    });

    it('should return 400 for negative sleep score', async () => {
      const request = new Request('http://localhost:3000/api/habits/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', sleep_score: -1 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for sleep score above 100', async () => {
      const request = new Request('http://localhost:3000/api/habits/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', sleep_score: 101 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Partial Updates', () => {
    it('should allow updating only sleep_score', async () => {
      vi.mocked(sql).mockResolvedValueOnce(undefined as unknown as never); // INSERT
      vi.mocked(sql).mockResolvedValueOnce([{
        date: '2025-01-15',
        sleep_score: 9,
        focus_minutes: 0,
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
      }]);

      const request = new Request('http://localhost:3000/api/habits/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', sleep_score: 9 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sleep_score).toBe(9);
    });

    it('should allow updating multiple fields', async () => {
      vi.mocked(sql).mockResolvedValueOnce(undefined as unknown as never);
      vi.mocked(sql).mockResolvedValueOnce([{
        date: '2025-01-15',
        sleep_score: 8,
        focus_minutes: 180,
        steps: 12000,
        reading_minutes: 45,
        outdoor_minutes: 90,
        writing_minutes: 60,
        coding_minutes: 240,
      }]);

      const request = new Request('http://localhost:3000/api/habits/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2025-01-15',
          sleep_score: 8,
          focus_minutes: 180,
          steps: 12000,
          reading_minutes: 45,
          outdoor_minutes: 90,
          writing_minutes: 60,
          coding_minutes: 240,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(revalidateDashboard).toHaveBeenCalled();
    });
  });
});
