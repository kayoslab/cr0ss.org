/**
 * Database queries for location_history table
 * Stores location data with weather information
 */

import { sql } from "./client";
import type { WeatherData } from "../services/openweathermap";

export interface LocationHistoryRecord {
  id: number;
  logged_at: Date;
  latitude: number;
  longitude: number;
  temp_celsius: number | null;
  feels_like_celsius: number | null;
  humidity: number | null;
  weather_main: string | null;
  weather_description: string | null;
  wind_speed_mps: number | null;
  cloudiness: number | null;
  weather_raw: Record<string, unknown> | null;
  created_at: Date;
}

/**
 * Insert a new location history record with weather data
 */
export async function insertLocationHistory(
  latitude: number,
  longitude: number,
  weather: WeatherData | null
): Promise<LocationHistoryRecord> {
  const rows = await sql`
    INSERT INTO location_history (
      latitude,
      longitude,
      temp_celsius,
      feels_like_celsius,
      humidity,
      weather_main,
      weather_description,
      wind_speed_mps,
      cloudiness,
      weather_raw
    ) VALUES (
      ${latitude},
      ${longitude},
      ${weather?.temp_celsius ?? null},
      ${weather?.feels_like_celsius ?? null},
      ${weather?.humidity ?? null},
      ${weather?.weather_main ?? null},
      ${weather?.weather_description ?? null},
      ${weather?.wind_speed_mps ?? null},
      ${weather?.cloudiness ?? null},
      ${weather ? JSON.stringify(weather.weather_raw) : null}
    )
    RETURNING *
  `;

  return rows[0] as LocationHistoryRecord;
}

/**
 * Get the most recent location record
 */
export async function getLatestLocation(): Promise<LocationHistoryRecord | null> {
  const rows = await sql`
    SELECT * FROM location_history
    ORDER BY logged_at DESC
    LIMIT 1
  `;

  return (rows[0] as LocationHistoryRecord) || null;
}

/**
 * Get the current location from the view
 * This is the recommended way to get the current location for display
 */
export async function getCurrentLocation(): Promise<LocationHistoryRecord | null> {
  const rows = await sql`
    SELECT * FROM current_location
  `;

  return (rows[0] as LocationHistoryRecord) || null;
}

/**
 * Get location history within a date range
 */
export async function getLocationHistory(
  startDate: Date,
  endDate: Date
): Promise<LocationHistoryRecord[]> {
  const rows = await sql`
    SELECT * FROM location_history
    WHERE logged_at >= ${startDate.toISOString()}
      AND logged_at <= ${endDate.toISOString()}
    ORDER BY logged_at DESC
  `;

  return rows as LocationHistoryRecord[];
}

/**
 * Get aggregated weather statistics for a date range
 */
export async function getWeatherStats(startDate: Date, endDate: Date) {
  const [stats] = await sql`
    SELECT
      AVG(temp_celsius) as avg_temp,
      MIN(temp_celsius) as min_temp,
      MAX(temp_celsius) as max_temp,
      AVG(humidity) as avg_humidity,
      AVG(cloudiness) as avg_cloudiness,
      COUNT(*) as record_count
    FROM location_history
    WHERE logged_at >= ${startDate.toISOString()}
      AND logged_at <= ${endDate.toISOString()}
      AND temp_celsius IS NOT NULL
  `;

  return stats;
}
