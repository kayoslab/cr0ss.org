import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock constants
vi.mock('@/lib/constants', () => ({
  CACHE_TAGS: {
    DASHBOARD: 'dashboard',
  },
  PATHS: {
    DASHBOARD: '/dashboard',
  },
}));

// Mock database location functions
vi.mock('@/lib/db/location', () => ({
  getLatestLocation: vi.fn(),
  insertLocationHistory: vi.fn(),
}));

// Mock env - now using standard auth
vi.mock('@/env', () => ({
  env: {
    DASHBOARD_API_SECRET: 'test-dashboard-secret',
  },
}));

import { POST } from './route';
import { getLatestLocation, insertLocationHistory } from '@/lib/db/location';

describe('POST /api/location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLatestLocation).mockResolvedValue(null);
    vi.mocked(insertLocationHistory).mockResolvedValue({
      id: 1,
      logged_at: new Date(),
      latitude: 52.52,
      longitude: 13.405,
      temp_celsius: null,
      feels_like_celsius: null,
      humidity: null,
      weather_main: null,
      weather_description: null,
      wind_speed_mps: null,
      cloudiness: null,
      weather_raw: null,
      created_at: new Date(),
    });
  });

  describe('authentication', () => {
    it('should return 401 with invalid secret', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'wrong-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 without secret', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('validation', () => {
    it('should return 400 without latitude', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid coordinates', code: 'VALIDATION_ERROR', details: expect.any(Object) });
    });

    it('should return 400 without longitude', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 52.52 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid coordinates', code: 'VALIDATION_ERROR', details: expect.any(Object) });
    });

    it('should return 400 with empty body', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid coordinates', code: 'VALIDATION_ERROR', details: expect.any(Object) });
    });

    it('should return 400 with null latitude', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: null, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid coordinates', code: 'VALIDATION_ERROR', details: expect.any(Object) });
    });

    it('should accept valid string coordinates', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: '52.52', lon: '13.405' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('revalidated');
      expect(data).toHaveProperty('now');
    });

    it('should return 400 with invalid string coordinates', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 'invalid', lon: 'invalid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid coordinates', code: 'VALIDATION_ERROR', details: expect.any(Object) });
    });

    it('should return 400 with NaN values', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: NaN, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid coordinates', code: 'VALIDATION_ERROR', details: expect.any(Object) });
    });
  });

  describe('first location update', () => {
    it('should store location when no previous location exists', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ revalidated: true });
      expect(data.now).toBeDefined();

      expect(insertLocationHistory).toHaveBeenCalledWith(52.52, 13.405, null);
    });
  });

  describe('location distance check', () => {
    it('should update when distance exceeds threshold (150km)', async () => {
      // Berlin coordinates
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: 52.52,
        longitude: 13.405,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      // Munich coordinates (~504km from Berlin)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 48.1351, lon: 11.582 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(true);

      expect(insertLocationHistory).toHaveBeenCalledWith(48.1351, 11.582, null);
    });

    it('should not update when distance is within threshold', async () => {
      // Berlin coordinates
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: 52.52,
        longitude: 13.405,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      // Very close to Berlin (same location)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);

      // Location is still inserted into history, but dashboard is not revalidated
      expect(insertLocationHistory).toHaveBeenCalledWith(52.52, 13.405, null);
    });

    it('should not update when distance is just under threshold', async () => {
      // Berlin
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: 52.52,
        longitude: 13.405,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      // Potsdam (~30km from Berlin center)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 52.4, lon: 13.06 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);

      // Location is still inserted into history, but dashboard is not revalidated
      expect(insertLocationHistory).toHaveBeenCalledWith(52.4, 13.06, null);
    });
  });

  describe('response format', () => {
    it('should include timestamp in response', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const beforeTimestamp = Date.now();
      const response = await POST(request);
      const afterTimestamp = Date.now();
      const data = await response.json();

      expect(data.now).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(data.now).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should return JSON content-type', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);

      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle coordinates at equator (lat = 0)', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: 0,
        longitude: 100,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 0, lon: 100 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);
    });

    it('should handle coordinates at prime meridian (lon = 0)', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: 51.5,
        longitude: 0,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 51.5, lon: 0 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);
    });

    it('should handle Null Island coordinates (0, 0)', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 0, lon: 0 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(true);
      expect(insertLocationHistory).toHaveBeenCalledWith(0, 0, null);
    });

    it('should handle negative coordinates', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: -33.865,
        longitude: 151.209,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      // Sydney to Melbourne (~714km)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: -37.814, lon: 144.963 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(true);
    });

    it('should handle coordinates at north pole', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: 90,
        longitude: 0,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: 90, lon: 0 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle coordinates at south pole', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue({
        id: 1,
        logged_at: new Date(),
        latitude: -90,
        longitude: 0,
        temp_celsius: null,
        feels_like_celsius: null,
        humidity: null,
        weather_main: null,
        weather_description: null,
        wind_speed_mps: null,
        cloudiness: null,
        weather_raw: null,
        created_at: new Date(),
      });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({ lat: -90, lon: 0 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle decimal coordinates with high precision', async () => {
      vi.mocked(getLatestLocation).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
        body: JSON.stringify({
          lat: 52.520008,
          lon: 13.404954,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(true);

      expect(insertLocationHistory).toHaveBeenCalledWith(52.520008, 13.404954, null);
    });
  });
});
