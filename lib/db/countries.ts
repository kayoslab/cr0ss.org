/**
 * Database queries for visited_countries table
 * Tracks country visits based on location history
 */

import { sql } from "./client";

export interface VisitedCountryRecord {
  id: number;
  country_code: string;
  first_visited: Date;
  last_visited: Date;
  visit_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Insert or update a visited country record
 * Increments visit_count and updates last_visited if country already exists
 */
export async function upsertVisitedCountry(
  countryCode: string
): Promise<VisitedCountryRecord> {
  const today = new Date().toISOString().split("T")[0];

  const rows = await sql`
    INSERT INTO visited_countries (
      country_code,
      first_visited,
      last_visited,
      visit_count
    ) VALUES (
      ${countryCode},
      ${today},
      ${today},
      1
    )
    ON CONFLICT (country_code)
    DO UPDATE SET
      last_visited = ${today},
      visit_count = visited_countries.visit_count + 1,
      updated_at = NOW()
    RETURNING *
  `;

  return rows[0] as VisitedCountryRecord;
}

/**
 * Get all visited countries ordered by last visit date
 */
export async function getVisitedCountriesFromDB(): Promise<
  VisitedCountryRecord[]
> {
  const rows = await sql`
    SELECT * FROM visited_countries
    ORDER BY last_visited DESC
  `;

  return rows as VisitedCountryRecord[];
}

/**
 * Get a single visited country by code
 */
export async function getVisitedCountryByCode(
  countryCode: string
): Promise<VisitedCountryRecord | null> {
  const rows = await sql`
    SELECT * FROM visited_countries
    WHERE country_code = ${countryCode}
    LIMIT 1
  `;

  return (rows[0] as VisitedCountryRecord) || null;
}

/**
 * Get visited countries as a map keyed by country code for efficient lookup
 */
export async function getVisitedCountriesMap(): Promise<
  Map<string, VisitedCountryRecord>
> {
  const countries = await getVisitedCountriesFromDB();
  return new Map(countries.map((c) => [c.country_code, c]));
}
