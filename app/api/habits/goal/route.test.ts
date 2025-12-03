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
  const sqlMock = vi.fn(() => Promise.resolve([]));
  Object.assign(sqlMock, {
    unsafe: vi.fn((query: string) => query),
  });
  return {
    sql: sqlMock,
  };
});

vi.mock('@/lib/cache/revalidate', () => ({
  revalidateDashboard: vi.fn(),
  revalidateCoffee: vi.fn(),
  revalidateHabits: vi.fn(),
  revalidateWorkouts: vi.fn(),
  revalidateShared: vi.fn(),
}));

vi.mock('@/lib/obs/trace', () => ({
  wrapTrace: <T extends (...args: unknown[]) => unknown>(_name: string, fn: T): T => fn,
}));

import { rateLimit } from '@/lib/rate/limit';
import { assertSecret } from '@/lib/auth/secret';
import { sql } from '@/lib/db/client';
import { revalidateShared } from '@/lib/cache/revalidate';

describe('GET /api/habits/goal', () => {
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

      const request = new Request('http://localhost:3000/api/habits/goal');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

      const request = new Request('http://localhost:3000/api/habits/goal');
      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('should call rateLimit with correct parameters', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValueOnce([]);

      const request = new Request('http://localhost:3000/api/habits/goal');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(
        request,
        'get-goal',
        { windowSec: 60, max: 30 }
      );
    });
  });

  describe('Data Fetching', () => {
    it('should return goals with default zeros for current month', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValueOnce([]);

      const request = new Request('http://localhost:3000/api/habits/goal');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        running_distance_km: 0,
        steps: 0,
        reading_minutes: 0,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      });
    });

    it('should return goals with values from database', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValueOnce([
        { kind: 'running_distance_km', target: 50 },
        { kind: 'steps', target: 300000 },
        { kind: 'reading_minutes', target: 600 },
      ]);

      const request = new Request('http://localhost:3000/api/habits/goal');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        running_distance_km: 50,
        steps: 300000,
        reading_minutes: 600,
        outdoor_minutes: 0,
        writing_minutes: 0,
        coding_minutes: 0,
        focus_minutes: 0,
      });
    });

    it('should handle all goal types', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValueOnce([
        { kind: 'running_distance_km', target: 100 },
        { kind: 'steps', target: 400000 },
        { kind: 'reading_minutes', target: 800 },
        { kind: 'outdoor_minutes', target: 600 },
        { kind: 'writing_minutes', target: 300 },
        { kind: 'coding_minutes', target: 2000 },
        { kind: 'focus_minutes', target: 1500 },
      ]);

      const request = new Request('http://localhost:3000/api/habits/goal');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.running_distance_km).toBe(100);
      expect(data.steps).toBe(400000);
      expect(data.reading_minutes).toBe(800);
      expect(data.outdoor_minutes).toBe(600);
      expect(data.writing_minutes).toBe(300);
      expect(data.coding_minutes).toBe(2000);
      expect(data.focus_minutes).toBe(1500);
    });
  });
});

describe('POST /api/habits/goal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
    vi.mocked(revalidateShared).mockImplementation(() => {});
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw { status: 401, message: 'Unauthorized' };
      });

      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running_distance_km: 50 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running_distance_km: 50 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Validation', () => {
    it('should return 400 for negative running distance', async () => {
      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running_distance_km: -10 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for negative steps', async () => {
      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: -1000 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative minutes', async () => {
      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reading_minutes: -60 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Partial Updates', () => {
    it('should update only running distance goal', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running_distance_km: 75 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(revalidateShared).toHaveBeenCalled();
    });

    it('should update multiple goals', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          running_distance_km: 100,
          steps: 350000,
          reading_minutes: 700,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(revalidateShared).toHaveBeenCalled();
    });

    it('should update all goals', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          running_distance_km: 120,
          steps: 400000,
          reading_minutes: 900,
          outdoor_minutes: 700,
          writing_minutes: 400,
          coding_minutes: 2500,
          focus_minutes: 1800,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(revalidateShared).toHaveBeenCalled();
    });

    it('should handle zero values as goal targets', async () => {
      vi.mocked(sql).mockResolvedValueOnce([{ month_start: '2025-01-01' }]);
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running_distance_km: 0 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
    });
  });
});
