/**
 * Cache tag utilities for granular cache invalidation
 *
 * Provides helpers for generating and managing cache tags following
 * the pattern: domain:resource:params
 *
 * This enables fine-grained cache invalidation strategies:
 * - Invalidate all coffee data: revalidateTag('coffee:*')
 * - Invalidate specific coffee summary: revalidateTag('coffee:summary:2025-12-05')
 * - Invalidate all summaries: revalidateTag('*:summary:*')
 */

/**
 * Cache tag builder for coffee domain
 *
 * @param resource - Resource type (e.g., 'summary', 'timeline', 'caffeine-curve')
 * @param params - Additional parameters for specificity (e.g., date)
 * @returns Formatted cache tag
 *
 * @example
 * ```ts
 * coffeeTags('summary', '2025-12-05')  // 'coffee:summary:2025-12-05'
 * coffeeTags('timeline')                // 'coffee:timeline'
 * ```
 */
export function coffeeTags(resource: string, ...params: (string | number)[]): string {
  const parts = ['coffee', resource, ...params.map(String)].filter(Boolean);
  return parts.join(':');
}

/**
 * Cache tag builder for workouts domain
 */
export function workoutsTags(resource: string, ...params: (string | number)[]): string {
  const parts = ['workouts', resource, ...params.map(String)].filter(Boolean);
  return parts.join(':');
}

/**
 * Cache tag builder for habits domain
 */
export function habitsTags(resource: string, ...params: (string | number)[]): string {
  const parts = ['habits', resource, ...params.map(String)].filter(Boolean);
  return parts.join(':');
}

/**
 * Cache tag builder for goals domain
 */
export function goalsTags(resource: string, ...params: (string | number)[]): string {
  const parts = ['goals', resource, ...params.map(String)].filter(Boolean);
  return parts.join(':');
}

/**
 * Cache tag builder for insights domain
 */
export function insightsTags(resource: string, ...params: (string | number)[]): string {
  const parts = ['insights', resource, ...params.map(String)].filter(Boolean);
  return parts.join(':');
}

/**
 * Cache tag builder for dashboard domain
 */
export function dashboardTags(resource: string, ...params: (string | number)[]): string {
  const parts = ['dashboard', resource, ...params.map(String)].filter(Boolean);
  return parts.join(':');
}

/**
 * Unified cache tag builder
 *
 * @param domain - Domain (coffee, workouts, habits, goals, insights, dashboard)
 * @param resource - Resource type
 * @param params - Additional parameters
 * @returns Formatted cache tag
 *
 * @example
 * ```ts
 * cacheTag('coffee', 'summary', '2025-12-05')
 * cacheTag('workouts', 'heatmap')
 * ```
 */
export function cacheTag(
  domain: 'coffee' | 'workouts' | 'habits' | 'goals' | 'insights' | 'dashboard',
  resource: string,
  ...params: (string | number)[]
): string {
  const parts = [domain, resource, ...params.map(String)].filter(Boolean);
  return parts.join(':');
}

/**
 * Parse a cache tag into its components
 *
 * @param tag - Cache tag to parse
 * @returns Object with domain, resource, and params
 *
 * @example
 * ```ts
 * parseTag('coffee:summary:2025-12-05')
 * // { domain: 'coffee', resource: 'summary', params: ['2025-12-05'] }
 * ```
 */
export function parseTag(tag: string): {
  domain: string;
  resource: string;
  params: string[];
} {
  const parts = tag.split(':');
  return {
    domain: parts[0] || '',
    resource: parts[1] || '',
    params: parts.slice(2),
  };
}

/**
 * Check if a cache tag matches a pattern
 *
 * Supports wildcards (*) in patterns
 *
 * @param tag - Cache tag to check
 * @param pattern - Pattern to match (supports *)
 * @returns True if tag matches pattern
 *
 * @example
 * ```ts
 * matchesPattern('coffee:summary:2025-12-05', 'coffee:*')        // true
 * matchesPattern('coffee:summary:2025-12-05', 'coffee:summary:*') // true
 * matchesPattern('coffee:summary:2025-12-05', 'workouts:*')      // false
 * ```
 */
export function matchesPattern(tag: string, pattern: string): boolean {
  const tagParts = tag.split(':');
  const patternParts = pattern.split(':');

  // If pattern has more parts than tag, it can't match
  if (patternParts.length > tagParts.length) {
    return false;
  }

  // Check each part
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const tagPart = tagParts[i];

    // Wildcard matches anything
    if (patternPart === '*') {
      continue;
    }

    // Parts must match exactly
    if (patternPart !== tagPart) {
      return false;
    }
  }

  return true;
}

/**
 * Generate multiple cache tags for an endpoint
 *
 * Useful when you want to tag a response with multiple invalidation strategies
 *
 * @example
 * ```ts
 * // Tag with both specific date and general summary
 * const tags = generateTags('coffee', 'summary', ['2025-12-05']);
 * // ['coffee:summary:2025-12-05', 'coffee:summary']
 * ```
 */
export function generateTags(
  domain: string,
  resource: string,
  params: (string | number)[],
  options: { includeGeneral?: boolean } = { includeGeneral: true }
): string[] {
  const tags: string[] = [];

  // Specific tag with all params
  if (params.length > 0) {
    tags.push(cacheTag(domain as Parameters<typeof cacheTag>[0], resource, ...params));
  }

  // General tag without params
  if (options.includeGeneral) {
    tags.push(cacheTag(domain as Parameters<typeof cacheTag>[0], resource));
  }

  return tags;
}

/**
 * Helper to get current date in Berlin timezone (YYYY-MM-DD format)
 *
 * Used as default for date-based cache tags
 */
export function getCurrentDateBerlin(): string {
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  return berlinTime.toISOString().split('T')[0];
}

/**
 * Cache configuration presets
 */
export const CACHE_DURATIONS = {
  /** Real-time data - 1 minute */
  REALTIME: 60,
  /** Frequently updated - 5 minutes */
  FREQUENT: 300,
  /** Standard - 15 minutes */
  STANDARD: 900,
  /** Rarely changes - 1 hour */
  STABLE: 3600,
  /** Very stable - 24 hours */
  LONG: 86400,
} as const;
