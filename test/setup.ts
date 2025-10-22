import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test@localhost:5432/test';
process.env.DASHBOARD_API_SECRET = 'test-secret';
process.env.CONTENTFUL_REVALIDATE_SECRET = 'test-revalidate-secret';
process.env.CONTENTFUL_SPACE_ID = 'test-space';
process.env.CONTENTFUL_ACCESS_TOKEN = 'test-token';
process.env.CONTENTFUL_ENVIRONMENT = 'test';
process.env.ALGOLIA_APP_ID = 'test-app-id';
process.env.ALGOLIA_ADMIN_KEY = 'test-admin-key';
process.env.ALGOLIA_SEARCH_KEY = 'test-search-key';
process.env.ALGOLIA_INDEX = 'test-index';
process.env.KV_REST_API_URL = 'http://localhost:8080';
process.env.KV_REST_API_TOKEN = 'test-token';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Mock Next.js specific modules that may not be available in test environment
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock Vercel KV
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    ttl: vi.fn(),
    multi: vi.fn(() => ({
      incr: vi.fn(),
      expire: vi.fn(),
      exec: vi.fn(async () => [1, 1]), // Return count of 1 (within limit)
    })),
  },
}));

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
