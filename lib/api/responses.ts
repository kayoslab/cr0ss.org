import { NextResponse } from 'next/server';

/**
 * Standardized API response helpers
 *
 * This module provides consistent response formats across all API routes.
 * All helpers return NextResponse for consistency with Next.js App Router.
 */

/**
 * Standard API error response structure
 */
export interface ApiError {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Creates a standardized error response
 *
 * @param error - Error message
 * @param status - HTTP status code (default: 500)
 * @param details - Optional error details
 * @param code - Optional error code (e.g., 'VALIDATION_ERROR')
 * @returns NextResponse with error body
 *
 * @example
 * ```ts
 * return apiError('Invalid email', 400, { field: 'email' }, 'VALIDATION_ERROR');
 * ```
 */
export function apiError(
  error: string,
  status: number = 500,
  details?: unknown,
  code?: string
): NextResponse<ApiError> {
  const response: ApiError = { error };
  if (details) response.details = details;
  if (code) response.code = code;

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized success response
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 *
 * @example
 * ```ts
 * return apiSuccess({ id: 123, created: true }, 201);
 * ```
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Creates a 401 Unauthorized response
 *
 * @param message - Error message (default: 'Unauthorized')
 * @param code - Error code (default: 'UNAUTHORIZED')
 * @returns NextResponse with 401 status
 *
 * @example
 * ```ts
 * if (!hasValidSecret(req)) {
 *   return unauthorized();
 * }
 * ```
 */
export function unauthorized(
  message: string = 'Unauthorized',
  code: string = 'UNAUTHORIZED'
): NextResponse<ApiError> {
  return apiError(message, 401, undefined, code);
}

/**
 * Creates a 429 Too Many Requests response with Retry-After header
 *
 * @param retryAfterSec - Seconds until client can retry
 * @param message - Error message (default: 'Too many requests')
 * @returns Response with 429 status and Retry-After header
 *
 * @example
 * ```ts
 * const rl = await rateLimit(req, 'bucket', { windowSec: 60, max: 10 });
 * if (!rl.ok) {
 *   return tooManyRequests(rl.retryAfterSec);
 * }
 * ```
 */
export function tooManyRequests(
  retryAfterSec: number,
  message: string = 'Too many requests'
): Response {
  return new Response(message, {
    status: 429,
    headers: {
      'Retry-After': String(retryAfterSec),
    },
  });
}

/**
 * Creates a 400 Bad Request response for validation errors
 *
 * @param message - Error message (default: 'Validation failed')
 * @param details - Validation error details
 * @returns NextResponse with 400 status
 *
 * @example
 * ```ts
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   return validationError('Invalid input', result.error.flatten());
 * }
 * ```
 */
export function validationError(
  message: string = 'Validation failed',
  details?: unknown
): NextResponse<ApiError> {
  return apiError(message, 400, details, 'VALIDATION_ERROR');
}

/**
 * Creates a 404 Not Found response
 *
 * @param resource - Name of the resource that wasn't found
 * @returns NextResponse with 404 status
 *
 * @example
 * ```ts
 * if (!user) {
 *   return notFound('User');
 * }
 * ```
 */
export function notFound(
  resource: string = 'Resource'
): NextResponse<ApiError> {
  return apiError(`${resource} not found`, 404, undefined, 'NOT_FOUND');
}

/**
 * Creates a 500 Internal Server Error response
 *
 * @param message - Error message (default: 'Internal server error')
 * @param details - Error details (only included in development)
 * @returns NextResponse with 500 status
 *
 * @example
 * ```ts
 * try {
 *   // ...
 * } catch (error) {
 *   return internalError('Database query failed', error);
 * }
 * ```
 */
export function internalError(
  message: string = 'Internal server error',
  details?: unknown
): NextResponse<ApiError> {
  // Only include details in development mode
  const includeDetails = process.env.NODE_ENV === 'development' ? details : undefined;
  return apiError(message, 500, includeDetails, 'INTERNAL_ERROR');
}
