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
}));

vi.mock('@/lib/obs/trace', () => ({
  wrapTrace: <T extends (...args: unknown[]) => unknown>(_name: string, fn: T): T => fn,
}));

vi.mock('@/lib/contentful/api/coffee', () => ({
  getAllCoffeeDTO: vi.fn(),
}));

vi.mock('@/lib/time/berlin', () => ({
  berlinDateTimeToUTCISO: vi.fn((date: string, time: string) => `${date}T${time}:00.000Z`),
}));

import { rateLimit } from '@/lib/rate/limit';
import { assertSecret } from '@/lib/auth/secret';
import { sql } from '@/lib/db/client';
import { revalidateDashboard } from '@/lib/cache/revalidate';
import { getAllCoffeeDTO } from '@/lib/contentful/api/coffee';

describe('GET /api/habits/coffee', () => {
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

      const request = new Request("http://localhost:3000/api/habits/coffee");
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

      const request = new Request('http://localhost:3000/api/habits/coffee');
      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('should call rateLimit with correct parameters', async () => {
      vi.mocked(getAllCoffeeDTO).mockResolvedValue({ items: [] });

      const request = new Request('http://localhost:3000/api/habits/coffee');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(
        request,
        'get-coffees',
        { windowSec: 60, max: 10 }
      );
    });
  });

  describe('Data Fetching', () => {
    it('should return coffee list from Contentful', async () => {
      const mockCoffees = [
        { id: '1', name: 'Espresso', roaster: 'Brazil Roasters' },
        { id: '2', name: 'Latte', roaster: 'Colombia Coffee Co' },
      ];
      vi.mocked(getAllCoffeeDTO).mockResolvedValue({ items: mockCoffees });

      const request = new Request('http://localhost:3000/api/habits/coffee');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockCoffees);
      expect(getAllCoffeeDTO).toHaveBeenCalledWith(1, 20);
    });
  });
});

describe('POST /api/habits/coffee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
    vi.mocked(revalidateDashboard).mockImplementation(() => {});
  });

  describe("Authentication", () => {
    it("should require authentication", async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw { status: 401, message: "Unauthorized" };
      });

      const request = new Request("http://localhost:3000/api/habits/coffee", {
        method: "POST",
        body: JSON.stringify({ date: "2025-01-15", type: "espresso", amount_ml: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', time: '10:30', type: 'espresso', amount_ml: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid date', async () => {
      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: 'invalid', time: '10:30', type: 'espresso', amount_ml: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for invalid coffee type', async () => {
      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', time: '10:30', type: 'invalid', amount_ml: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative amount', async () => {
      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', time: '10:30', type: 'espresso', amount_ml: -10 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Single Entry', () => {
    it('should insert single coffee entry', async () => {
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', time: '10:30', type: 'espresso', amount_ml: 30 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.inserted).toBe(1);
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should handle time as wall-clock format', async () => {
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', time: '14:30', type: 'v60', amount_ml: 200 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.inserted).toBe(1);
    });
  });

  describe('Multiple Entries', () => {
    it('should insert multiple coffee entries', async () => {
      vi.mocked(sql).mockResolvedValue(undefined as never);

      const entries = [
        { date: '2025-01-15', time: '08:00', type: 'espresso', amount_ml: 30 },
        { date: '2025-01-15', time: '14:00', type: 'v60', amount_ml: 180 },
      ];

      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.inserted).toBe(2);
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should fail all entries if one is invalid', async () => {
      const entries = [
        { date: '2025-01-15', time: '08:00', type: 'espresso', amount_ml: 30 },
        { date: '2025-01-15', time: '14:00', type: 'invalid', amount_ml: 180 },
      ];

      const request = new Request('http://localhost:3000/api/habits/coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(revalidateDashboard).not.toHaveBeenCalled();
    });
  });
});
