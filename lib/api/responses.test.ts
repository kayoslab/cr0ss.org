import { describe, it, expect, vi } from 'vitest';
import {
  apiError,
  apiSuccess,
  unauthorized,
  tooManyRequests,
  validationError,
  notFound,
  internalError,
} from './responses';

describe('API Response Helpers', () => {
  describe('apiError', () => {
    it('should create error with default status 500', async () => {
      const response = apiError('Something went wrong');

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Something went wrong');
    });

    it('should create error with custom status', async () => {
      const response = apiError('Not found', 404);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('should include details when provided', async () => {
      const details = { field: 'email', issue: 'invalid' };
      const response = apiError('Validation failed', 400, details);

      const body = await response.json();
      expect(body.details).toEqual(details);
    });

    it('should include code when provided', async () => {
      const response = apiError('Error', 500, undefined, 'ERR_CODE');

      const body = await response.json();
      expect(body.code).toBe('ERR_CODE');
    });

    it('should include both details and code', async () => {
      const details = { reason: 'timeout' };
      const response = apiError('Failed', 500, details, 'TIMEOUT');

      const body = await response.json();
      expect(body.error).toBe('Failed');
      expect(body.details).toEqual(details);
      expect(body.code).toBe('TIMEOUT');
    });
  });

  describe('apiSuccess', () => {
    it('should create success response with default status 200', async () => {
      const data = { id: 1, name: 'Test' };
      const response = apiSuccess(data);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should create success response with custom status', async () => {
      const data = { created: true, id: 123 };
      const response = apiSuccess(data, 201);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should handle null data', async () => {
      const response = apiSuccess(null);

      const body = await response.json();
      expect(body).toBe(null);
    });

    it('should handle array data', async () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const response = apiSuccess(data);

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should handle boolean data', async () => {
      const response = apiSuccess(true);

      const body = await response.json();
      expect(body).toBe(true);
    });
  });

  describe('unauthorized', () => {
    it('should create 401 response with default message', async () => {
      const response = unauthorized();

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should create 401 response with custom message', async () => {
      const response = unauthorized('Invalid token');

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe('Invalid token');
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should create 401 response with custom code', async () => {
      const response = unauthorized('Token expired', 'TOKEN_EXPIRED');

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe('Token expired');
      expect(body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('tooManyRequests', () => {
    it('should create 429 response with Retry-After header', async () => {
      const response = tooManyRequests(60);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should create 429 response with custom message', async () => {
      const response = tooManyRequests(120, 'Rate limit exceeded');

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('120');
      const text = await response.text();
      expect(text).toBe('Rate limit exceeded');
    });

    it('should handle fractional retry times', async () => {
      const response = tooManyRequests(30.5);

      expect(response.headers.get('Retry-After')).toBe('30.5');
    });

    it('should handle zero retry time', async () => {
      const response = tooManyRequests(0);

      expect(response.headers.get('Retry-After')).toBe('0');
    });
  });

  describe('validationError', () => {
    it('should create 400 response with default message', async () => {
      const response = validationError();

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should create 400 response with custom message', async () => {
      const response = validationError('Invalid email format');

      const body = await response.json();
      expect(body.error).toBe('Invalid email format');
    });

    it('should include validation details', async () => {
      const details = {
        fieldErrors: { email: ['Invalid format'] },
        formErrors: [],
      };
      const response = validationError('Validation failed', details);

      const body = await response.json();
      expect(body.details).toEqual(details);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('notFound', () => {
    it('should create 404 response with default resource', async () => {
      const response = notFound();

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Resource not found');
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should create 404 response with custom resource', async () => {
      const response = notFound('User');

      const body = await response.json();
      expect(body.error).toBe('User not found');
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should create 404 response for multiple resource types', async () => {
      const blogResponse = notFound('Blog post');
      const userResponse = notFound('User');
      const fileResponse = notFound('File');

      const blogBody = await blogResponse.json();
      const userBody = await userResponse.json();
      const fileBody = await fileResponse.json();

      expect(blogBody.error).toBe('Blog post not found');
      expect(userBody.error).toBe('User not found');
      expect(fileBody.error).toBe('File not found');
    });
  });

  describe('internalError', () => {
    it('should create 500 response with default message', async () => {
      const response = internalError();

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    it('should create 500 response with custom message', async () => {
      const response = internalError('Database connection failed');

      const body = await response.json();
      expect(body.error).toBe('Database connection failed');
    });

    it('should include details in development mode', async () => {
      // Use vi.stubEnv to mock NODE_ENV
      vi.stubEnv('NODE_ENV', 'development');

      const details = { stack: 'Error: test\n  at ...' };
      const response = internalError('Server error', details);

      const body = await response.json();
      expect(body.details).toEqual(details);

      vi.unstubAllEnvs();
    });

    it('should NOT include details in production mode', async () => {
      // Use vi.stubEnv to mock NODE_ENV
      vi.stubEnv('NODE_ENV', 'production');

      const details = { stack: 'Error: test\n  at ...' };
      const response = internalError('Server error', details);

      const body = await response.json();
      expect(body.details).toBeUndefined();

      vi.unstubAllEnvs();
    });

    it('should NOT include details when env is not development', async () => {
      // In test mode by default, so this should not include details
      const details = { sensitive: 'data' };
      const response = internalError('Error', details);

      const body = await response.json();
      expect(body.details).toBeUndefined();
    });
  });

  describe('response consistency', () => {
    it('all error helpers should return consistent structure', async () => {
      const responses = [
        unauthorized(),
        validationError(),
        notFound(),
        internalError(),
      ];

      for (const response of responses) {
        const body = await response.json();
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('code');
        expect(typeof body.error).toBe('string');
        expect(typeof body.code).toBe('string');
      }
    });

    it('status codes should match HTTP standards', async () => {
      const cases = [
        { fn: () => apiSuccess({}) , expected: 200 },
        { fn: () => apiSuccess({}, 201), expected: 201 },
        { fn: () => validationError(), expected: 400 },
        { fn: () => unauthorized(), expected: 401 },
        { fn: () => tooManyRequests(60), expected: 429 },
        { fn: () => notFound(), expected: 404 },
        { fn: () => internalError(), expected: 500 },
      ];

      for (const { fn, expected } of cases) {
        const response = fn();
        expect(response.status).toBe(expected);
      }
    });
  });
});
