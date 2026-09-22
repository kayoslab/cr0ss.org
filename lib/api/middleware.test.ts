import { describe, it, expect, vi } from 'vitest';
import { validateRequestBody, withErrorHandler, createApiRoute } from './middleware';
import { apiSuccess as createSuccessResponse } from './responses';
import { z } from 'zod';

// Mock env for auth tests
vi.mock('@/env', () => ({
  env: {
    DASHBOARD_API_SECRET: 'test-dashboard-secret-1234567890',
    CONTENTFUL_REVALIDATE_SECRET: 'test-revalidate-secret',
  },
}));

describe('API Middleware Helpers', () => {
  describe('validateRequestBody', () => {
    const TestSchema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    it('should validate and return data for valid request', async () => {
      const validBody = { email: 'test@example.com', age: 25 };
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(validBody),
      });

      const result = await validateRequestBody(request, TestSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validBody);
      }
    });

    it('should return error response for invalid data', async () => {
      const invalidBody = { email: 'not-an-email', age: 15 };
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      });

      const result = await validateRequestBody(request, TestSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(400);
        const body = await result.response.json();
        expect(body.error).toBe('Validation failed');
        expect(body.code).toBe('VALIDATION_ERROR');
        expect(body.details).toBeDefined();
      }
    });

    it('should return error for invalid JSON', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: 'not json',
      });

      const result = await validateRequestBody(request, TestSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(400);
        const body = await result.response.json();
        expect(body.error).toBe('Invalid JSON in request body');
        expect(body.code).toBe('INVALID_JSON');
      }
    });

    it('should return error for missing required fields', async () => {
      const incompleteBody = { email: 'test@example.com' };
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(incompleteBody),
      });

      const result = await validateRequestBody(request, TestSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('withErrorHandler', () => {
    it('should return handler result when no error occurs', async () => {
      const handler = async () => createSuccessResponse({ ok: true });
      const wrapped = withErrorHandler(handler);
      const request = new Request('http://localhost');

      const response = await wrapped(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    });

    it('should catch and return Response errors', async () => {
      const handler = async () => {
        throw new Response('Unauthorized', { status: 401 });
      };
      const wrapped = withErrorHandler(handler);
      const request = new Request('http://localhost');

      const response = await wrapped(request);

      expect(response.status).toBe(401);
    });

    it('should catch Error instances and return 500', async () => {
      const handler = async () => {
        throw new Error('Database connection failed');
      };
      const wrapped = withErrorHandler(handler);
      const request = new Request('http://localhost');

      const response = await wrapped(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    it('should catch unknown errors and return 500', async () => {
      const handler = async () => {
        throw 'string error';
      };
      const wrapped = withErrorHandler(handler);
      const request = new Request('http://localhost');

      const response = await wrapped(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('An unexpected error occurred');
    });
  });

  describe('ApiRouteBuilder', () => {
    it('should create a basic route handler', async () => {
      const handler = createApiRoute().handle(async () => {
        return createSuccessResponse({ message: 'Hello' });
      });

      const request = new Request('http://localhost');
      const response = await handler(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe('Hello');
    });

    it('should execute middleware in order', async () => {
      const order: number[] = [];

      type TestContext = { values: number[]; clientId?: string };

      const handler = createApiRoute<TestContext>()
        .use(async (_req, ctx) => {
          ctx.values = [];
          ctx.values.push(1);
          order.push(1);
        })
        .use(async (_req, ctx) => {
          ctx.values.push(2);
          order.push(2);
        })
        .handle(async (_req, ctx) => {
          order.push(3);
          return createSuccessResponse({ values: ctx.values });
        });

      const request = new Request('http://localhost');
      const response = await handler(request);

      expect(order).toEqual([1, 2, 3]);
      const body = await response.json();
      expect(body.values).toEqual([1, 2]);
    });

    it('should handle errors in middleware', async () => {
      const handler = createApiRoute()
        .use(async () => {
          throw new Error('Middleware error');
        })
        .handle(async () => {
          return createSuccessResponse({ ok: true });
        });

      const request = new Request('http://localhost');
      const response = await handler(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });

    it('should allow middleware to throw Response for early termination', async () => {
      const handler = createApiRoute()
        .use(async () => {
          throw new Response('Forbidden', { status: 403 });
        })
        .handle(async () => {
          return createSuccessResponse({ ok: true });
        });

      const request = new Request('http://localhost');
      const response = await handler(request);

      expect(response.status).toBe(403);
      const text = await response.text();
      expect(text).toBe('Forbidden');
    });

    describe('withAuth', () => {
      it('should add authentication middleware', async () => {
        const handler = createApiRoute()
          .withAuth()
          .handle(async () => {
            return createSuccessResponse({ authenticated: true });
          });

        // Without secret - should return 401
        const requestWithoutAuth = new Request('http://localhost');
        const responseWithoutAuth = await handler(requestWithoutAuth);
        expect(responseWithoutAuth.status).toBe(401);

        // With secret - should succeed
        const requestWithAuth = new Request('http://localhost', {
          headers: { 'x-admin-secret': 'test-dashboard-secret-1234567890' },
        });
        const responseWithAuth = await handler(requestWithAuth);
        expect(responseWithAuth.status).toBe(200);
      });
    });

    describe('withRateLimit', () => {
      it('should add rate limiting middleware', async () => {
        // This test would require mocking rateLimit which is complex
        // For now, we'll test the integration in route tests
        const handler = createApiRoute()
          .withRateLimit('test-bucket', { windowSec: 60, max: 10 })
          .handle(async () => {
            return createSuccessResponse({ ok: true });
          });

        const request = new Request('http://localhost');
        const response = await handler(request);

        // Should succeed (rateLimit is mocked in setup.ts to always return ok: true)
        expect(response.status).toBe(200);
      });

      it('should pass clientId in context', async () => {
        const handler = createApiRoute()
          .withRateLimit('test-bucket', { windowSec: 60, max: 10 })
          .handle(async (_req, ctx) => {
            return createSuccessResponse({ clientId: ctx.clientId });
          });

        const request = new Request('http://localhost');
        const response = await handler(request);

        const body = await response.json();
        // clientId should be set by rate limit middleware
        expect(body).toHaveProperty('clientId');
      });
    });

    describe('withTrace', () => {
      it('should add tracing wrapper', async () => {
        const handler = createApiRoute()
          .withTrace('TEST /api/test')
          .handle(async () => {
            return createSuccessResponse({ traced: true });
          });

        const request = new Request('http://localhost');
        const response = await handler(request);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.traced).toBe(true);
      });
    });

    describe('chaining', () => {
      it('should support chaining auth, rate limit, and trace', async () => {
        const handler = createApiRoute()
          .withAuth()
          .withRateLimit('chain-test', { windowSec: 60, max: 10 })
          .withTrace('TEST /api/chain')
          .handle(async (_req, ctx) => {
            return createSuccessResponse({
              success: true,
              hasClientId: !!ctx.clientId,
            });
          });

        const request = new Request('http://localhost', {
          headers: { 'x-admin-secret': 'test-dashboard-secret-1234567890' },
        });
        const response = await handler(request);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.hasClientId).toBe(true);
      });
    });
  });
});
