/**
 * HTTP Status Codes
 * Centralized constants for all HTTP status codes used in the application
 */

export const HTTP_STATUS = {
  // Success 2xx
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors 4xx
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors 5xx
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common HTTP response messages
 */
export const HTTP_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  METHOD_NOT_ALLOWED: 'Method not allowed',
  TOO_MANY_REQUESTS: 'Too many requests',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  INVALID_JSON: 'Invalid JSON',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
} as const;

/**
 * Content-Type headers
 */
export const CONTENT_TYPE = {
  JSON: 'application/json',
  TEXT: 'text/plain',
  HTML: 'text/html',
} as const;
