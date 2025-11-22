/**
 * Centralized rate limit bucket constants
 *
 * These buckets are used with the rate limiting system to track
 * and enforce request limits for different API endpoints.
 *
 * Naming convention: `{method}-{resource}` or `{resource}-{action}`
 */
export const RATE_LIMIT_BUCKETS = {
  // Dashboard
  /** GET /api/dashboard */
  GET_DASHBOARD: 'get-dashboard',

  // Search
  /** POST /api/algolia/search */
  ALGOLIA_SEARCH: 'algolia-search',

  // Coffee habits
  /** GET /api/habits/coffee */
  GET_COFFEES: 'get-coffees',
  /** POST /api/habits/coffee */
  POST_COFFEE: 'post-coffee',

  // Running habits
  /** GET /api/habits/run */
  GET_RUN: 'get-run',
  /** POST /api/habits/run */
  POST_RUN: 'post-run',

  // Workout habits
  /** GET /api/habits/workout */
  GET_WORKOUT: 'get-workout',
  /** POST /api/habits/workout */
  POST_WORKOUT: 'post-workout',

  // Day habits
  /** GET /api/habits/day */
  GET_DAY: 'get-day',
  /** POST /api/habits/day */
  POST_DAY: 'post-day',

  // Body metrics
  /** GET /api/habits/body */
  GET_BODY: 'get-body',
  /** POST /api/habits/body */
  POST_BODY: 'post-body',

  // Goals
  /** GET /api/habits/goal */
  GET_GOAL: 'get-goal',
  /** POST /api/habits/goal */
  POST_GOAL: 'post-goal',

  // AI Chat (openai/gpt-4o-mini via Vercel AI Gateway)
  /** POST /api/chat - 10 requests per 12 hours */
  AI_CHAT: 'ai-chat',
} as const;

/**
 * Type-safe helper for rate limit bucket names
 */
export type RateLimitBucket = typeof RATE_LIMIT_BUCKETS[keyof typeof RATE_LIMIT_BUCKETS];
