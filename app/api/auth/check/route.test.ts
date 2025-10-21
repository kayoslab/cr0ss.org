import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock the auth module
vi.mock('@/lib/auth/secret', () => ({
  assertSecret: vi.fn((req: Request) => {
    const headers = new Headers(req.headers);
    const adminSecret = headers.get('x-vercel-revalidation-key');
    const contentfulSecret = headers.get('x-vercel-revalidation-key');

    if (
      !adminSecret &&
      !contentfulSecret
    ) {
      throw { status: 401 };
    }
  }),
}));

describe('GET /api/auth/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with valid secret', async () => {
    const request = new Request('http://localhost:3000/api/auth/check', {
      method: 'GET',
      headers: {
        'x-vercel-revalidation-key': 'test-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
  });

  it('should return 401 without secret header', async () => {
    const request = new Request('http://localhost:3000/api/auth/check', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should handle errors gracefully', async () => {
    const request = new Request('http://localhost:3000/api/auth/check', {
      method: 'GET',
    });

    const response = await GET(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should return JSON response', async () => {
    const request = new Request('http://localhost:3000/api/auth/check', {
      method: 'GET',
      headers: {
        'x-vercel-revalidation-key': 'test-secret',
      },
    });

    const response = await GET(request);

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
