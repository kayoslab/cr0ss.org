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
import { revalidateWorkouts } from '@/lib/cache/revalidate';

describe('GET /api/habits/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
  });

  describe("Authentication", () => {
    it("should require authentication", async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw { status: 401, message: "Unauthorized" };
      });

      const request = new Request("http://localhost:3000/api/habits/run");
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

      const request = new Request('http://localhost:3000/api/habits/run');
      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('should call rateLimit with correct parameters', async () => {
      vi.mocked(sql).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/habits/run');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(
        request,
        'get-run',
        { windowSec: 60, max: 30 }
      );
    });
  });

  describe('Data Fetching', () => {
    it('should return list of runs', async () => {
      const mockRuns = [
        { id: 1, date: '2025-01-15', distance_km: 5.2, duration_min: 30, avg_pace_sec_per_km: 346 },
        { id: 2, date: '2025-01-14', distance_km: 10.0, duration_min: 55, avg_pace_sec_per_km: 330 },
      ];
      vi.mocked(sql).mockResolvedValue(mockRuns);

      const request = new Request('http://localhost:3000/api/habits/run');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockRuns);
    });

    it('should return empty array when no runs exist', async () => {
      vi.mocked(sql).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/habits/run');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });
  });
});

describe('POST /api/habits/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
    vi.mocked(revalidateWorkouts).mockImplementation(() => {});
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw { status: 401, message: 'Unauthorized' };
      });

      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', distance_km: 5.2, duration_min: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', distance_km: 5.2, duration_min: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid date', async () => {
      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: 'invalid', distance_km: 5.2, duration_min: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for negative distance', async () => {
      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', distance_km: -5, duration_min: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative duration', async () => {
      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', distance_km: 5.2, duration_min: -10 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Single Entry', () => {
    it('should insert single run entry', async () => {
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', distance_km: 5.2, duration_min: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.inserted).toBe(1);
      expect(revalidateWorkouts).toHaveBeenCalled();
    });

    it('should insert run with optional avg_pace_sec_per_km', async () => {
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: '2025-01-15', 
          distance_km: 5.2, 
          duration_min: 30,
          avg_pace_sec_per_km: 346
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.inserted).toBe(1);
    });
  });

  describe('Multiple Entries', () => {
    it('should insert multiple run entries', async () => {
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const entries = [
        { date: '2025-01-15', distance_km: 5.2, duration_min: 30 },
        { date: '2025-01-14', distance_km: 10.0, duration_min: 55 },
      ];

      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.inserted).toBe(2);
      expect(revalidateWorkouts).toHaveBeenCalled();
    });

    it('should fail all entries if one is invalid', async () => {
      const entries = [
        { date: '2025-01-15', distance_km: 5.2, duration_min: 30 },
        { date: '2025-01-14', distance_km: -10, duration_min: 55 },
      ];

      const request = new Request('http://localhost:3000/api/habits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(revalidateWorkouts).not.toHaveBeenCalled();
    });
  });
});
