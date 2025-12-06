import { z } from 'zod';
import { SECRET_HEADER } from '@/lib/auth/constants';

/**
 * API client for internal dashboard API calls
 *
 * Provides typed fetch wrappers for calling internal API endpoints
 * with proper error handling and type safety.
 */

/**
 * Base API error thrown by the client
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  /** Query parameters to append to the URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request headers */
  headers?: HeadersInit;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Next.js revalidation time (for cached responses) */
  revalidate?: number | false;
  /** Next.js cache tags (for tagged cache invalidation) */
  tags?: string[];
}

/**
 * Get the base URL for API calls
 * In server components, we need absolute URLs
 * In browser, relative URLs work fine
 */
function getBaseUrl(): string {
  // Check if we're in a browser context
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side: use environment variable or fallback to localhost
  // In production, VERCEL_URL or custom domain should be set
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Development fallback - check for PORT env var
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

/**
 * Builds a URL with query parameters
 */
function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Build full URL
  const baseUrl = getBaseUrl();
  const url = new URL(normalizedPath, baseUrl);

  // Add query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Get API secret for server-side requests
 * Only available in server context
 *
 * Note: We access process.env directly instead of using the env module
 * because the env module's experimental__runtimeEnv doesn't work properly
 * with Edge runtime. Edge runtime does support process.env access.
 */
function getApiSecret(): string | undefined {
  // Only in server context
  if (typeof window === 'undefined') {
    const secret = process.env.DASHBOARD_API_SECRET;
    console.log('[API Client] Getting secret', {
      hasSecret: !!secret,
      secretLength: secret?.length || 0,
      isServer: typeof window === 'undefined',
      runtime: process.env.NEXT_RUNTIME || 'nodejs',
    });
    if (!secret) {
      console.warn('[API Client] DASHBOARD_API_SECRET is not set in environment. API calls will fail authentication.');
    }
    return secret;
  }
  return undefined;
}

/**
 * Internal fetch wrapper with error handling
 */
async function fetchApi<T>(
  url: string,
  options: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {}
): Promise<T> {
  try {
    // Add API secret header for server-side requests
    const apiSecret = getApiSecret();
    if (apiSecret) {
      options.headers = {
        ...options.headers,
        [SECRET_HEADER]: apiSecret,
      };
    }

    // Debug logging for every request
    console.log('[API Client] Making request:', {
      url,
      method: options.method || 'GET',
      hasAuthHeader: !!(options.headers as Record<string, string>)?.[SECRET_HEADER],
      runtime: process.env.NEXT_RUNTIME || 'nodejs',
      isServer: typeof window === 'undefined',
    });

    const response = await fetch(url, options);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorCode: string | undefined;
      let errorDetails: unknown;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorCode = errorData.code;
        errorDetails = errorData.details;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiClientError(errorMessage, response.status, errorCode, errorDetails);
    }

    // Parse successful response
    return await response.json();
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Wrap other errors
    if (error instanceof Error) {
      throw new ApiClientError(error.message, 0, 'FETCH_ERROR', error);
    }

    throw new ApiClientError('Unknown error occurred', 0, 'UNKNOWN_ERROR');
  }
}

/**
 * GET request with optional Zod schema validation
 *
 * @param url - API endpoint URL (relative or absolute)
 * @param options - Request options
 * @param schema - Optional Zod schema for response validation
 * @returns Typed response data
 *
 * @example
 * ```ts
 * const data = await apiGet('/api/v1/dashboard/coffee/summary', {
 *   params: { date: '2025-12-05' }
 * }, CoffeeSummarySchema);
 * ```
 */
export async function apiGet<T>(
  url: string,
  options?: ApiRequestOptions,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const fullUrl = buildUrl(url, options?.params);

  const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  // Add Next.js cache options if provided
  if (options?.revalidate !== undefined || options?.tags) {
    fetchOptions.next = {
      ...(options.revalidate !== undefined && { revalidate: options.revalidate }),
      ...(options.tags && { tags: options.tags }),
    };
  }

  const data = await fetchApi<T>(fullUrl, fetchOptions);

  // Validate with Zod schema if provided
  if (schema) {
    return schema.parse(data);
  }

  return data;
}

/**
 * POST request with optional Zod schema validation
 *
 * @param url - API endpoint URL (relative or absolute)
 * @param body - Request body
 * @param options - Request options
 * @param schema - Optional Zod schema for response validation
 * @returns Typed response data
 *
 * @example
 * ```ts
 * const result = await apiPost('/api/v1/dashboard/coffee', {
 *   date: '2025-12-05',
 *   type: 'espresso'
 * }, {}, CreateCoffeeResponseSchema);
 * ```
 */
export async function apiPost<T>(
  url: string,
  body?: unknown,
  options?: ApiRequestOptions,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const fullUrl = buildUrl(url, options?.params);

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const data = await fetchApi<T>(fullUrl, fetchOptions);

  // Validate with Zod schema if provided
  if (schema) {
    return schema.parse(data);
  }

  return data;
}

/**
 * PUT request with optional Zod schema validation
 */
export async function apiPut<T>(
  url: string,
  body?: unknown,
  options?: ApiRequestOptions,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const fullUrl = buildUrl(url, options?.params);

  const fetchOptions: RequestInit = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const data = await fetchApi<T>(fullUrl, fetchOptions);

  if (schema) {
    return schema.parse(data);
  }

  return data;
}

/**
 * DELETE request with optional Zod schema validation
 */
export async function apiDelete<T>(
  url: string,
  options?: ApiRequestOptions,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const fullUrl = buildUrl(url, options?.params);

  const fetchOptions: RequestInit = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  const data = await fetchApi<T>(fullUrl, fetchOptions);

  if (schema) {
    return schema.parse(data);
  }

  return data;
}

/**
 * Type-safe helper for creating API endpoints with base URL
 */
export function createApiClient(baseUrl: string) {
  return {
    get: <T>(path: string, options?: ApiRequestOptions, schema?: z.ZodSchema<T>) =>
      apiGet<T>(`${baseUrl}${path}`, options, schema),
    post: <T>(path: string, body?: unknown, options?: ApiRequestOptions, schema?: z.ZodSchema<T>) =>
      apiPost<T>(`${baseUrl}${path}`, body, options, schema),
    put: <T>(path: string, body?: unknown, options?: ApiRequestOptions, schema?: z.ZodSchema<T>) =>
      apiPut<T>(`${baseUrl}${path}`, body, options, schema),
    delete: <T>(path: string, options?: ApiRequestOptions, schema?: z.ZodSchema<T>) =>
      apiDelete<T>(`${baseUrl}${path}`, options, schema),
  };
}

/**
 * Pre-configured client for dashboard API v1
 */
export const dashboardApi = createApiClient('/api/v1/dashboard');
