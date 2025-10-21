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

vi.mock('@/lib/api/middleware', () => ({
  createErrorResponse: vi.fn((message: string, status: number) => 
    new Response(JSON.stringify({ message }), { status })
  ),
  createSuccessResponse: vi.fn((data: unknown, status = 200) => 
    new Response(JSON.stringify(data), { status })
  ),
}));

vi.mock('@/lib/db/workouts', () => ({
  insertWorkoutDB: vi.fn(),
  getRecentWorkoutsDB: vi.fn(),
  getWorkoutsByTypeDB: vi.fn(),
}));

import { rateLimit } from '@/lib/rate/limit';
import { assertSecret } from '@/lib/auth/secret';
import { revalidateDashboard } from '@/lib/cache/revalidate';
import { insertWorkoutDB, getRecentWorkoutsDB, getWorkoutsByTypeDB } from '@/lib/db/workouts';

describe('GET /api/habits/workout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw new Error('Unauthorized');
      });

      const request = new Request('http://localhost:3000/api/habits/workout');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(assertSecret).toHaveBeenCalledWith(request);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 45 });

      const request = new Request('http://localhost:3000/api/habits/workout');
      const response = await GET(request);

      expect(response.status).toBe(429);
    });

    it('should call rateLimit with correct parameters', async () => {
      vi.mocked(getRecentWorkoutsDB).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/habits/workout');
      await GET(request);

      expect(rateLimit).toHaveBeenCalledWith(
        request,
        'get-workout',
        { windowSec: 60, max: 10 }
      );
    });
  });

  describe('Data Fetching', () => {
    it('should return recent workouts by default', async () => {
      const mockWorkouts = [
        { 
          id: 1, 
          date: new Date('2025-01-15'), 
          workout_type: 'climbing' as const, 
          duration_min: 45,
          intensity: 'medium' as const,
          perceived_effort: undefined,
          details: undefined,
          notes: undefined,
          created_at: '2025-01-15T10:00:00Z',
        }, 
        { 
          id: 2, 
          date: new Date('2025-01-14'), 
          workout_type: 'running' as const, 
          duration_min: 30,
          intensity: 'high' as const,
          perceived_effort: undefined,
          details: undefined,
          notes: undefined,
          created_at: '2025-01-14T10:00:00Z',
        },
      ];
      vi.mocked(getRecentWorkoutsDB).mockResolvedValue(mockWorkouts);

      const request = new Request('http://localhost:3000/api/habits/workout');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      // JSON.stringify removes undefined fields and converts Dates to ISO strings
      expect(data).toEqual([
        {
          id: 1,
          date: '2025-01-15T00:00:00.000Z',
          workout_type: 'climbing',
          duration_min: 45,
          intensity: 'medium',
          created_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 2,
          date: '2025-01-14T00:00:00.000Z',
          workout_type: 'running',
          duration_min: 30,
          intensity: 'high',
          created_at: '2025-01-14T10:00:00Z',
        },
      ]);
      expect(getRecentWorkoutsDB).toHaveBeenCalledWith(50);
    });    it('should filter by workout type when specified', async () => {
      const mockWorkouts = [
        { 
          id: 1, 
          date: new Date('2025-01-15'), 
          workout_type: 'climbing' as const, 
          duration_min: 45,
          intensity: 'medium' as const,
          perceived_effort: undefined,
          details: undefined,
          notes: undefined,
          created_at: '2025-01-15T10:00:00Z',
        },
      ];
      vi.mocked(getWorkoutsByTypeDB).mockResolvedValue(mockWorkouts);

      const request = new Request('http://localhost:3000/api/habits/workout?type=strength&limit=50');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([
        {
          id: 1,
          date: '2025-01-15T00:00:00.000Z',
          workout_type: 'climbing',
          duration_min: 45,
          intensity: 'medium',
          created_at: '2025-01-15T10:00:00Z',
        },
      ]);
      expect(getWorkoutsByTypeDB).toHaveBeenCalledWith('strength', 50);
    });

    it('should respect custom limit parameter', async () => {
      vi.mocked(getRecentWorkoutsDB).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/habits/workout?limit=10');
      await GET(request);

      expect(getRecentWorkoutsDB).toHaveBeenCalledWith(10);
    });

    it('should combine type and limit parameters', async () => {
      vi.mocked(getWorkoutsByTypeDB).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/habits/workout?type=cardio&limit=20');
      await GET(request);

      expect(getWorkoutsByTypeDB).toHaveBeenCalledWith('cardio', 20);
    });
  });
});

describe('POST /api/habits/workout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
    vi.mocked(assertSecret).mockImplementation(() => {});
    vi.mocked(revalidateDashboard).mockImplementation(() => {});
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(assertSecret).mockImplementation(() => {
        throw new Error('Unauthorized');
      });

      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', workout_type: 'strength', duration_min: 45 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 60 });

      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', workout_type: 'strength', duration_min: 45 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(429);
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid date', async () => {
      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: 'invalid', workout_type: 'climbing', duration_min: 45 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
    });

    it('should return 400 for invalid workout type', async () => {
      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', workout_type: 'invalid', duration_min: 45 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative duration', async () => {
      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', workout_type: 'climbing', duration_min: -10 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Single Entry', () => {
    it('should insert single workout entry', async () => {
      const mockWorkout = { 
        id: 1, 
        date: new Date('2025-01-15'), 
        workout_type: 'climbing' as const, 
        duration_min: 45,
        intensity: undefined,
        perceived_effort: undefined,
        details: undefined,
        notes: undefined,
        created_at: '2025-01-15T10:00:00Z',
      };
      vi.mocked(insertWorkoutDB).mockResolvedValue(mockWorkout);

      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2025-01-15', workout_type: 'strength', duration_min: 45 }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.inserted).toBe(1);
      expect(data.workouts).toEqual([
        {
          id: 1,
          date: '2025-01-15T00:00:00.000Z',
          workout_type: 'climbing',
          duration_min: 45,
          created_at: '2025-01-15T10:00:00Z',
        },
      ]);
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should insert workout with optional details', async () => {
      const mockWorkout = { 
        id: 1, 
        date: new Date('2025-01-15'), 
        workout_type: 'climbing' as const, 
        duration_min: 45,
        intensity: 'moderate' as const,
        perceived_effort: 7,
        details: { exercises: ['squat', 'bench'] },
        notes: undefined,
        created_at: '2025-01-15T10:00:00Z',
      };
      vi.mocked(insertWorkoutDB).mockResolvedValue(mockWorkout);

      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: '2025-01-15', 
          workout_type: 'climbing', 
          duration_min: 45,
          intensity: 'moderate',
          perceived_effort: 7,
          details: { exercises: ['squat', 'bench'] }
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.inserted).toBe(1);
    });
  });

  describe('Multiple Entries', () => {
    it('should insert multiple workout entries', async () => {
      const mockWorkouts = [
        { 
          id: 1, 
          date: new Date('2025-01-15'), 
          workout_type: 'climbing' as const, 
          duration_min: 45,
          intensity: undefined,
          perceived_effort: undefined,
          details: undefined,
          notes: undefined,
          created_at: '2025-01-15T10:00:00Z',
        },
        { 
          id: 2, 
          date: new Date('2025-01-14'), 
          workout_type: 'running' as const, 
          duration_min: 30,
          intensity: undefined,
          perceived_effort: undefined,
          details: undefined,
          notes: undefined,
          created_at: '2025-01-14T10:00:00Z',
        },
      ];
      vi.mocked(insertWorkoutDB)
        .mockResolvedValueOnce(mockWorkouts[0])
        .mockResolvedValueOnce(mockWorkouts[1]);

      const entries = [
        { date: '2025-01-15', workout_type: 'climbing', duration_min: 45 },
        { date: '2025-01-14', workout_type: 'running', duration_min: 30 },
      ];

      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.inserted).toBe(2);
      expect(data.workouts).toEqual([
        {
          id: 1,
          date: '2025-01-15T00:00:00.000Z',
          workout_type: 'climbing',
          duration_min: 45,
          created_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 2,
          date: '2025-01-14T00:00:00.000Z',
          workout_type: 'running',
          duration_min: 30,
          created_at: '2025-01-14T10:00:00Z',
        },
      ]);
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should fail all entries if one is invalid', async () => {
      const entries = [
        { date: '2025-01-15', workout_type: 'climbing', duration_min: 45 },
        { date: '2025-01-14', workout_type: 'invalid', duration_min: 30 },
      ];

      const request = new Request('http://localhost:3000/api/habits/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(revalidateDashboard).not.toHaveBeenCalled();
      expect(insertWorkoutDB).not.toHaveBeenCalled();
    });
  });
});
