/**
 * Centralized path constants
 *
 * These paths are used for revalidation and navigation throughout the application.
 */
export const PATHS = {
  /** Dashboard page */
  DASHBOARD: '/dashboard',
  /** Blog collection page */
  BLOG: '/blog',
  /** Home page */
  HOME: '/',
} as const;

/**
 * Type-safe helper for path values
 */
export type AppPath = typeof PATHS[keyof typeof PATHS];
