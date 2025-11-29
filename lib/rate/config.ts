/**
 * Rate Limiting Configuration
 * Centralized configuration for all rate limits across the application
 */

export interface RateLimitConfig {
  /**
   * Time window in seconds
   */
  windowSec: number;
  /**
   * Maximum requests allowed within the window
   */
  max: number;
}

/**
 * Rate limit configurations for different API endpoints
 */
export const RATE_LIMITS = {
  /**
   * AI Chat endpoint - more restrictive due to cost
   * 10 requests per 60 seconds
   */
  AI_CHAT: {
    windowSec: 60,
    max: 10,
  } as RateLimitConfig,

  /**
   * Habits endpoints (coffee, day, workout, run, body, goal)
   * 30 requests per 60 seconds
   */
  HABITS: {
    windowSec: 60,
    max: 30,
  } as RateLimitConfig,

  /**
   * Location endpoint
   * 10 requests per 60 seconds
   */
  LOCATION: {
    windowSec: 60,
    max: 10,
  } as RateLimitConfig,

  /**
   * Algolia search endpoint
   * 100 requests per 60 seconds (generous for user experience)
   */
  SEARCH: {
    windowSec: 60,
    max: 100,
  } as RateLimitConfig,

  /**
   * Analytics endpoint
   * 50 requests per 60 seconds
   */
  ANALYTICS: {
    windowSec: 60,
    max: 50,
  } as RateLimitConfig,

  /**
   * Revalidation endpoint - very restrictive
   * 5 requests per 300 seconds (5 minutes)
   */
  REVALIDATE: {
    windowSec: 300,
    max: 5,
  } as RateLimitConfig,

  /**
   * Default rate limit for unspecified endpoints
   * 30 requests per 60 seconds
   */
  DEFAULT: {
    windowSec: 60,
    max: 30,
  } as RateLimitConfig,
} as const;

/**
 * HTTP Status codes for rate limiting
 */
export const RATE_LIMIT_STATUS = {
  /**
   * Too Many Requests
   */
  TOO_MANY_REQUESTS: 429,
} as const;

/**
 * Helper to get rate limit config by endpoint name
 */
export function getRateLimitConfig(endpoint: keyof typeof RATE_LIMITS): RateLimitConfig {
  return RATE_LIMITS[endpoint] || RATE_LIMITS.DEFAULT;
}
