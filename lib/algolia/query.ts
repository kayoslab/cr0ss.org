/**
 * Case, surrounding and repeated whitespace don't change Algolia's results,
 * so collapsing them lets equivalent queries share one cache entry.
 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}
