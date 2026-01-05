export const runtime = 'nodejs';

import { createApiRoute } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { dashboardTags, CACHE_DURATIONS } from '@/lib/api/cache';
import { getAllCountries, getVisitedCountries } from '@/lib/contentful/api/country';
import { z } from 'zod';

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  visited: z.enum(['true', 'false']).optional(),
});

/**
 * Response schema for countries endpoint
 */
const CountrySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  visited: z.boolean(),
  lastVisited: z.string().optional(),
});

const CountriesResponseSchema = z.object({
  countries: z.array(CountrySchema),
  total: z.number().int().min(0),
  visited_count: z.number().int().min(0),
});

export type CountriesResponse = z.infer<typeof CountriesResponseSchema>;

/**
 * GET /api/v1/dashboard/countries
 *
 * Returns country data from Contentful, optionally filtered by visited status.
 *
 * Query Parameters:
 * - visited (optional): 'true' to show only visited countries, 'false' for unvisited, omit for all
 *
 * Response:
 * - countries: Array of country objects
 * - total: Total number of countries returned
 * - visited_count: Number of visited countries in the response
 *
 * Cache:
 * - Duration: 1 hour (STABLE) - Contentful data changes infrequently
 * - Tags: dashboard:countries, dashboard:countries:visited (when filtered)
 *
 * Example:
 * GET /api/v1/dashboard/countries?visited=true
 * {
 *   "countries": [
 *     {
 *       "id": "germany",
 *       "name": "Germany",
 *       "path": "M 123.4 567.8...",
 *       "visited": true,
 *       "lastVisited": "2024-12-25"
 *     }
 *   ],
 *   "total": 15,
 *   "visited_count": 15
 * }
 */
export const GET = createApiRoute()
  .withAuth()
  .withRateLimit('dashboard-countries', { windowSec: 60, max: 30 })
  .withTrace('GET /api/v1/dashboard/countries')
  .handle(async (request) => {
    try {
      // Parse query parameters
      const url = new URL(request.url);
      const visitedParam = url.searchParams.get('visited');

      // Validate query parameters if provided
      let filter: 'all' | 'visited' | 'unvisited' = 'all';
      if (visitedParam) {
        const paramsResult = QueryParamsSchema.safeParse({ visited: visitedParam });
        if (!paramsResult.success) {
          return apiError(
            'Invalid query parameters',
            400,
            paramsResult.error.flatten(),
            'VALIDATION_ERROR'
          );
        }
        filter = paramsResult.data.visited === 'true' ? 'visited' : 'unvisited';
      }

      // Fetch countries from Contentful
      let countriesRaw: unknown[];
      if (filter === 'visited') {
        countriesRaw = await getVisitedCountries(true);
      } else if (filter === 'unvisited') {
        countriesRaw = await getVisitedCountries(false);
      } else {
        countriesRaw = await getAllCountries();
      }

      // Transform Contentful data to API response format
      const countries = countriesRaw.map((country: any) => ({
        id: country.id,
        name: country.name,
        path: country.data?.path || '',
        visited: !!country.lastVisited,
        lastVisited: country.lastVisited || undefined,
      }));

      const visited_count = countries.filter((c) => c.visited).length;

      const response = {
        countries,
        total: countries.length,
        visited_count,
      };

      // Validate response schema
      const validatedResponse = CountriesResponseSchema.parse(response);

      // Generate cache tags
      const tags = [dashboardTags('countries')];
      if (filter === 'visited') {
        tags.push(dashboardTags('countries', 'visited'));
      }

      // Return response with cache headers
      const apiResponse = apiSuccess(validatedResponse);

      // Add cache tags via Next.js headers
      apiResponse.headers.set('X-Cache-Tags', tags.join(','));

      // Add cache control header (1 hour - Contentful data changes infrequently)
      apiResponse.headers.set(
        'Cache-Control',
        `s-maxage=${CACHE_DURATIONS.STABLE}, stale-while-revalidate`
      );

      return apiResponse;
    } catch (error) {
      console.error('Error fetching countries:', error);

      if (error instanceof Error) {
        return apiError(
          'Failed to fetch countries',
          500,
          process.env.NODE_ENV === 'development' ? error.message : undefined,
          'INTERNAL_ERROR'
        );
      }

      return apiError('An unexpected error occurred', 500, undefined, 'INTERNAL_ERROR');
    }
  });
