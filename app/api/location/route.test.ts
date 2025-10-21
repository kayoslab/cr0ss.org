import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @vercel/kv - must be before imports
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock env
vi.mock('@/env', () => ({
  env: {
    LOCATION_API_SECRET: 'test-location-secret',
  },
}));

import { POST } from './route';
import { kv } from '@vercel/kv';

describe('POST /api/location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kv.get).mockResolvedValue(null);
    vi.mocked(kv.set).mockResolvedValue('OK');
  });

  describe('authentication', () => {
    it('should return 401 with invalid secret', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'wrong-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ message: 'Invalid secret' });
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
      expect(data).toEqual({ message: 'Invalid secret' });
    });
  });

  describe('validation', () => {
    it('should return 400 without latitude', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: 'No geo position provided' });
    });

    it('should return 400 without longitude', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 52.52 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: 'No geo position provided' });
    });

    it('should return 400 with empty body', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: 'No geo position provided' });
    });

    it('should return 400 with null latitude', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: null, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: 'No geo position provided' });
    });

    it('should return 400 with string coordinates', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: '52.52', lon: '13.405' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: 'No geo position provided' });
    });

    it('should return 400 with NaN values', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: NaN, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ message: 'No geo position provided' });
    });
  });

  describe('first location update', () => {
    it('should store location when no previous location exists', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ revalidated: true });
      expect(data.now).toBeDefined();

      expect(kv.set).toHaveBeenCalledWith('GEOLOCATION', {
        lat: 52.52,
        lon: 13.405,
      });
    });
  });

  describe('location distance check', () => {
    it('should update when distance exceeds threshold (150km)', async () => {
      // Berlin coordinates
      vi.mocked(kv.get).mockResolvedValue({ lat: 52.52, lon: 13.405 });

      // Munich coordinates (~504km from Berlin)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 48.1351, lon: 11.582 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(true);

      expect(kv.set).toHaveBeenCalledWith('GEOLOCATION', {
        lat: 48.1351,
        lon: 11.582,
      });
    });

    it('should not update when distance is within threshold', async () => {
      // Berlin coordinates
      vi.mocked(kv.get).mockResolvedValue({ lat: 52.52, lon: 13.405 });

      // Very close to Berlin (same location)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 52.52, lon: 13.405 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);

      expect(kv.set).not.toHaveBeenCalled();
    });

    it('should not update when distance is just under threshold', async () => {
      // Berlin
      vi.mocked(kv.get).mockResolvedValue({ lat: 52.52, lon: 13.405 });

      // Potsdam (~30km from Berlin center)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 52.4, lon: 13.06 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);

      expect(kv.set).not.toHaveBeenCalled();
    });
  });

  describe('response format', () => {
    it('should include timestamp in response', async () => {
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
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
          token: 'test-location-secret',
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
      vi.mocked(kv.get).mockResolvedValue({ lat: 0, lon: 100 });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 0, lon: 100 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);
    });

    it('should handle coordinates at prime meridian (lon = 0)', async () => {
      vi.mocked(kv.get).mockResolvedValue({ lat: 51.5, lon: 0 });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 51.5, lon: 0 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(false);
    });

    it('should handle Null Island coordinates (0, 0)', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 0, lon: 0 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(true);
      expect(kv.set).toHaveBeenCalledWith('GEOLOCATION', { lat: 0, lon: 0 });
    });

    it('should handle negative coordinates', async () => {
      vi.mocked(kv.get).mockResolvedValue({ lat: -33.865, lon: 151.209 });

      // Sydney to Melbourne (~714km)
      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: -37.814, lon: 144.963 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.revalidated).toBe(true);
    });

    it('should handle coordinates at north pole', async () => {
      vi.mocked(kv.get).mockResolvedValue({ lat: 90, lon: 0 });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: 90, lon: 0 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle coordinates at south pole', async () => {
      vi.mocked(kv.get).mockResolvedValue({ lat: -90, lon: 0 });

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
        },
        body: JSON.stringify({ lat: -90, lon: 0 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle decimal coordinates with high precision', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: 'test-location-secret',
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

      expect(kv.set).toHaveBeenCalledWith('GEOLOCATION', {
        lat: 52.520008,
        lon: 13.404954,
      });
    });
  });
});
