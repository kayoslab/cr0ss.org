import { describe, it, expect, vi } from 'vitest';

// Mock env - must be before imports
vi.mock('@/env', () => ({
  env: {
    DASHBOARD_API_SECRET: 'test-dashboard-secret',
    CONTENTFUL_REVALIDATE_SECRET: 'test-revalidate-secret',
  },
}));

import { hasValidSecret, assertSecret } from './secret';

// Use the same values from the mock
const TEST_DASHBOARD_SECRET = 'test-dashboard-secret';
const TEST_REVALIDATE_SECRET = 'test-revalidate-secret';

describe('Auth Secret Utilities', () => {
  describe('hasValidSecret', () => {
    it('should return true with valid x-admin-secret header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': TEST_DASHBOARD_SECRET,
        },
      });

      expect(hasValidSecret(request)).toBe(true);
    });

    it('should return true with valid x-vercel-revalidation-key header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-vercel-revalidation-key': TEST_REVALIDATE_SECRET,
        },
      });

      expect(hasValidSecret(request)).toBe(true);
    });

    it('should return false with no secret header', () => {
      const request = new Request('http://localhost');

      expect(hasValidSecret(request)).toBe(false);
    });

    it('should return false with invalid x-admin-secret', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': 'wrong-secret',
        },
      });

      expect(hasValidSecret(request)).toBe(false);
    });

    it('should return false with invalid x-vercel-revalidation-key', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-vercel-revalidation-key': 'wrong-secret',
        },
      });

      expect(hasValidSecret(request)).toBe(false);
    });

    it('should return false with empty secret header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': '',
        },
      });

      expect(hasValidSecret(request)).toBe(false);
    });

    it('should prioritize x-admin-secret when both are present and valid', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': TEST_DASHBOARD_SECRET,
          'x-vercel-revalidation-key': TEST_REVALIDATE_SECRET,
        },
      });

      expect(hasValidSecret(request)).toBe(true);
    });

    it('should return true if only x-vercel-revalidation-key is valid', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': 'wrong',
          'x-vercel-revalidation-key': TEST_REVALIDATE_SECRET,
        },
      });

      expect(hasValidSecret(request)).toBe(true);
    });

    it('should be case-sensitive for secret values', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': TEST_DASHBOARD_SECRET.toUpperCase(),
        },
      });

      // Secrets are case-sensitive
      expect(hasValidSecret(request)).toBe(false);
    });
  });

  describe('assertSecret', () => {
    it('should not throw with valid x-admin-secret header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': TEST_DASHBOARD_SECRET,
        },
      });

      expect(() => assertSecret(request)).not.toThrow();
    });

    it('should not throw with valid x-vercel-revalidation-key header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-vercel-revalidation-key': TEST_REVALIDATE_SECRET,
        },
      });

      expect(() => assertSecret(request)).not.toThrow();
    });

    it('should throw 401 Response with no secret header', async () => {
      const request = new Request('http://localhost');

      expect(() => assertSecret(request)).toThrow(Response);

      try {
        assertSecret(request);
      } catch (err) {
        if (err instanceof Response) {
          expect(err.status).toBe(401);
          const body = await err.json();
          expect(body.error).toBe('Unauthorized');
        } else {
          throw new Error('Expected Response to be thrown');
        }
      }
    });

    it('should throw 401 Response with invalid secret', async () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-admin-secret': 'invalid-secret',
        },
      });

      expect(() => assertSecret(request)).toThrow(Response);

      try {
        assertSecret(request);
      } catch (err) {
        if (err instanceof Response) {
          expect(err.status).toBe(401);
          expect(err.headers.get('content-type')).toBe('application/json');
          const body = await err.json();
          expect(body.error).toBe('Unauthorized');
        } else {
          throw new Error('Expected Response to be thrown');
        }
      }
    });

    it('should throw Response that can be returned directly from API route', async () => {
      const request = new Request('http://localhost');

      try {
        assertSecret(request);
        throw new Error('Should have thrown');
      } catch (err) {
        if (err instanceof Response) {
          // Verify this is a valid Response that can be returned
          expect(err.status).toBe(401);
          expect(err.headers.get('content-type')).toBe('application/json');

          // Should be able to read body as JSON
          const body = await err.json();
          expect(body).toEqual({ error: 'Unauthorized' });
        } else {
          throw err;
        }
      }
    });
  });

  describe('integration with API route pattern', () => {
    it('should work with typical API route error handling', async () => {
      async function mockApiRoute(req: Request): Promise<Response> {
        try {
          assertSecret(req);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        } catch (error) {
          // If assertSecret throws a Response, return it directly
          if (error instanceof Response) {
            return error;
          }
          throw error;
        }
      }

      // Test with invalid secret
      const invalidRequest = new Request('http://localhost');
      const errorResponse = await mockApiRoute(invalidRequest);
      expect(errorResponse.status).toBe(401);
      const errorBody = await errorResponse.json();
      expect(errorBody.error).toBe('Unauthorized');

      // Test with valid secret
      const validRequest = new Request('http://localhost', {
        headers: { 'x-admin-secret': TEST_DASHBOARD_SECRET },
      });
      const successResponse = await mockApiRoute(validRequest);
      expect(successResponse.status).toBe(200);
      const successBody = await successResponse.json();
      expect(successBody.success).toBe(true);
    });
  });
});
