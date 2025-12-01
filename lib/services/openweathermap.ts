/**
 * OpenWeatherMap API Integration
 * Fetches current weather data for given coordinates
 *
 * API Documentation: https://openweathermap.org/current
 */

export interface WeatherData {
  temp_celsius: number;
  feels_like_celsius: number;
  humidity: number;
  weather_main: string;
  weather_description: string;
  wind_speed_mps: number;
  cloudiness: number;
  weather_raw: Record<string, unknown>;
}

interface OpenWeatherResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
}

/**
 * Fetch current weather data from OpenWeatherMap API
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Weather data or null if fetch fails
 */
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.error("OPENWEATHER_API_KEY is not configured");
    return null;
  }

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("lat", latitude.toString());
    url.searchParams.set("lon", longitude.toString());
    url.searchParams.set("appid", apiKey);
    url.searchParams.set("units", "metric"); // Use Celsius

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(
        `OpenWeatherMap API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = (await response.json()) as OpenWeatherResponse;

    return {
      temp_celsius: data.main.temp,
      feels_like_celsius: data.main.feels_like,
      humidity: data.main.humidity,
      weather_main: data.weather[0]?.main || "Unknown",
      weather_description: data.weather[0]?.description || "Unknown",
      wind_speed_mps: data.wind.speed,
      cloudiness: data.clouds.all,
      weather_raw: data as unknown as Record<string, unknown>,
    };
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    return null;
  }
}
