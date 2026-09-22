/**
 * Countries for the travel map: static shapes from Contentful merged with
 * visit history from the database.
 */
import { z } from 'zod';
import { cacheLife, cacheTag } from 'next/cache';
import { tags } from '@/lib/cache/tags';
import { getAllCountries } from '@/lib/contentful/api/country';
import { getVisitedCountriesMap } from '@/lib/db/countries';

export const CountrySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  visited: z.boolean(),
  firstVisited: z.string().optional(),
  lastVisited: z.string().optional(),
  visitCount: z.number().int().min(0).optional(),
});
export type Country = z.infer<typeof CountrySchema>;

export const CountriesSchema = z.object({
  countries: z.array(CountrySchema),
  total: z.number().int().min(0),
  visited_count: z.number().int().min(0),
});
export type Countries = z.infer<typeof CountriesSchema>;
export type CountryFilter = 'all' | 'visited' | 'unvisited';

const ymd = (d: string | Date) => new Date(d).toISOString().split('T')[0];
const byLastVisited = (a: Country, b: Country) => {
  if (!a.lastVisited) return 1;
  if (!b.lastVisited) return -1;
  return b.lastVisited.localeCompare(a.lastVisited);
};

async function queryCountries(filter: CountryFilter): Promise<Countries> {
  const [raw, visitedMap] = await Promise.all([
    getAllCountries(),
    getVisitedCountriesMap(),
  ]);

  const all: Country[] = raw.map(
    (country: { id?: string; name?: string; data?: { path?: string } }) => {
      const visit = country.id
        ? visitedMap.get(country.id.toUpperCase())
        : undefined;
      return {
        id: country.id ?? '',
        name: country.name ?? '',
        path: country.data?.path || '',
        visited: !!visit,
        firstVisited: visit ? ymd(visit.first_visited) : undefined,
        lastVisited: visit ? ymd(visit.last_visited) : undefined,
        visitCount: visit ? visit.visit_count : undefined,
      };
    }
  );

  const visited = all.filter((c) => c.visited).sort(byLastVisited);
  const unvisited = all.filter((c) => !c.visited);
  const countries =
    filter === 'visited'
      ? visited
      : filter === 'unvisited'
        ? unvisited
        : [...visited, ...unvisited];

  return CountriesSchema.parse({
    countries,
    total: countries.length,
    visited_count: countries.filter((c) => c.visited).length,
  });
}

export async function getCountries(filter: CountryFilter): Promise<Countries> {
  'use cache';
  cacheLife('stable');
  cacheTag(tags.dashboard.countries, tags.content.countries);
  return queryCountries(filter);
}
