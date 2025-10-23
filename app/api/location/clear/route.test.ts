import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @vercel/kv
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    del: vi.fn(),
  },
}));

// Mock env
vi.mock('@/env', () => ({
  env: {
    DASHBOARD_API_SECRET: 'test-dashboard-secret',
  },
}));

// Mock revalidate
vi.mock('@/lib/cache/revalidate', () => ({
  revalidateDashboard: vi.fn(),
}));

import { POST } from './route';
import { kv } from '@vercel/kv';
import { revalidateDashboard } from '@/lib/cache/revalidate';

describe('POST /api/location/clear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kv.get).mockResolvedValue(null);
    vi.mocked(kv.del).mockResolvedValue(1);
  });

  describe('authentication', () => {
    it('should return 401 with invalid secret', async () => {
      const request = new Request('http://localhost:3000/api/location/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'wrong-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 without secret', async () => {
      const request = new Request('http://localhost:3000/api/location/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('clearing location', () => {
    it('should clear location data when it exists', async () => {
      const oldLocation = { lat: 52.52, lon: 13.405 };
      vi.mocked(kv.get).mockResolvedValue(oldLocation);

      const request = new Request('http://localhost:3000/api/location/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cleared).toBe(true);
      expect(data.oldLocation).toEqual(oldLocation);
      expect(data.now).toBeDefined();

      expect(kv.del).toHaveBeenCalledWith('GEOLOCATION');
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should handle clearing when no location exists', async () => {
      vi.mocked(kv.get).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/location/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cleared).toBe(true);
      expect(data.oldLocation).toBeNull();
      expect(data.now).toBeDefined();

      expect(kv.del).toHaveBeenCalledWith('GEOLOCATION');
      expect(revalidateDashboard).toHaveBeenCalled();
    });

    it('should revalidate dashboard after clearing', async () => {
      const request = new Request('http://localhost:3000/api/location/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
      });

      await POST(request);

      expect(revalidateDashboard).toHaveBeenCalledTimes(1);
    });

    it('should include timestamp in response', async () => {
      const request = new Request('http://localhost:3000/api/location/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
      });

      const beforeTimestamp = Date.now();
      const response = await POST(request);
      const afterTimestamp = Date.now();
      const data = await response.json();

      expect(data.now).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(data.now).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should return JSON content-type', async () => {
      const request = new Request('http://localhost:3000/api/location/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': 'test-dashboard-secret',
        },
      });

      const response = await POST(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
