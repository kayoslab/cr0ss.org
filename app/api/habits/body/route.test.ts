import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';

// Mock dependencies
vi.mock('@/lib/rate/limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/auth/secret', () => ({
  assertSecret: vi.fn(),
}));

vi.mock('@/lib/cache/revalidate', () => ({
  revalidateDashboard: vi.fn(),
}));

vi.mock('@/lib/obs/trace', () => ({
  wrapTrace: <T extends (...args: unknown[]) => unknown>(_name: string, fn: T): T => fn,
}));

vi.mock('@/lib/db/profile', () => ({
  getBodyProfileDB: vi.fn(),
  upsertBodyProfileDB: vi.fn(),
}));

import { rateLimit } from '@/lib/rate/limit';
import { assertSecret } from '@/lib/auth/secret';
import { revalidateDashboard } from '@/lib/cache/revalidate';
import { getBodyProfileDB, upsertBodyProfileDB } from '@/lib/db/profile';

describe('GET /api/habits/body', () => {
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

      const request = new Request('http://localhost:3000/api/habits/body');
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

      const request = new Request('http://localhost:3000/api/habits/body');
      const response = await GET(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('should call rateLimit with correct parameters', async () => {
      vi.mocked(getBodyProfileDB).mockResolvedValue({
        id: 1,
        measured_at: '2025-01-15T10:00:00Z',
        weight_kg: 70,
        height_cm: 175,
        body_fat_percentage: null,
        muscle_percentage: null,
        vd_l_per_kg: null,
        half_life_hours: null,
        caffeine_sensitivity: null,
        bioavailability: null,
        age: 30,
        sex: 'male',
        notes: null,
        created_at: '2025-01-15T10:00:00Z',
      });

      const request = new Request('http://localhost:3000/api/habits/body');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(
        request,
        'get-body',
        { windowSec: 60, max: 30 }
      );
    });
  });

  describe('Data Fetching', () => {
    it('should return body profile', async () => {
      const mockProfile = {
        id: 1,
        measured_at: '2025-01-15T10:00:00Z',
        weight_kg: 75.5,
        height_cm: 180,
        age: 32,
        sex: 'male' as const,
        body_fat_percentage: 15.5,
        muscle_percentage: null,
        vd_l_per_kg: null,
        half_life_hours: null,
        caffeine_sensitivity: null,
        bioavailability: null,
        notes: null,
        created_at: '2025-01-15T10:00:00Z',
      };
      vi.mocked(getBodyProfileDB).mockResolvedValue(mockProfile);

      const request = new Request('http://localhost:3000/api/habits/body');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockProfile);
      expect(getBodyProfileDB).toHaveBeenCalled();
    });

    it('should return minimal profile', async () => {
      const mockProfile = {
        id: 2,
        measured_at: '2025-01-14T10:00:00Z',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        sex: 'female' as const,
        body_fat_percentage: null,
        muscle_percentage: null,
        vd_l_per_kg: null,
        half_life_hours: null,
        caffeine_sensitivity: null,
        bioavailability: null,
        notes: null,
        created_at: '2025-01-14T10:00:00Z',
      };
      vi.mocked(getBodyProfileDB).mockResolvedValue(mockProfile);

      const request = new Request('http://localhost:3000/api/habits/body');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockProfile);
    });
  });
});

describe('POST /api/habits/body', () => {
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

      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: 75 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: 75 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Validation', () => {
    it('should return 400 for negative weight', async () => {
      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: -10 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for invalid sex', async () => {
      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sex: 'invalid' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative height', async () => {
      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height_cm: -100 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative age', async () => {
      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: -5 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Partial Updates', () => {
    it('should update only weight', async () => {
      const mockProfile = {
        id: 1,
        measured_at: '2025-01-15T10:00:00Z',
        weight_kg: 76,
        height_cm: 180,
        age: 32,
        sex: 'male' as const,
        body_fat_percentage: null,
        muscle_percentage: null,
        vd_l_per_kg: null,
        half_life_hours: null,
        caffeine_sensitivity: null,
        bioavailability: null,
        notes: null,
        created_at: '2025-01-15T10:00:00Z',
      };
      vi.mocked(upsertBodyProfileDB).mockResolvedValue(mockProfile);

      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: 76 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.profile.weight_kg).toBe(76);
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const mockProfile = {
        id: 1,
        measured_at: '2025-01-15T10:00:00Z',
        weight_kg: 75,
        height_cm: 180,
        age: 32,
        sex: 'male' as const,
        body_fat_percentage: 14.5,
        muscle_percentage: null,
        vd_l_per_kg: null,
        half_life_hours: null,
        caffeine_sensitivity: null,
        bioavailability: null,
        notes: null,
        created_at: '2025-01-15T10:00:00Z',
      };
      vi.mocked(upsertBodyProfileDB).mockResolvedValue(mockProfile);

      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight_kg: 75,
          height_cm: 180,
          body_fat_percentage: 14.5,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.profile).toEqual(mockProfile);
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should handle full profile update', async () => {
      const fullProfileUpdate = {
        measured_at: new Date('2025-01-15T10:00:00Z'),
        weight_kg: 78,
        height_cm: 182,
        age: 35,
        sex: 'male' as const,
        body_fat_percentage: 16.0,
        muscle_percentage: 30.0,
        vd_l_per_kg: 0.6,
        half_life_hours: 5.5,
        caffeine_sensitivity: 1.0,
        bioavailability: 0.9,
        notes: 'Full profile test',
      };
      const fullProfile = {
        id: 1,
        measured_at: '2025-01-15T10:00:00Z',
        weight_kg: 78,
        height_cm: 182,
        age: 35,
        sex: 'male' as const,
        body_fat_percentage: 16.0,
        muscle_percentage: 30.0,
        vd_l_per_kg: 0.6,
        half_life_hours: 5.5,
        caffeine_sensitivity: 1.0,
        bioavailability: 0.9,
        notes: 'Full profile test',
        created_at: '2025-01-15T10:00:00Z',
      };
      vi.mocked(upsertBodyProfileDB).mockResolvedValue(fullProfile);

      const request = new Request('http://localhost:3000/api/habits/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullProfileUpdate),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.profile).toEqual(fullProfile);
    });
  });
});
