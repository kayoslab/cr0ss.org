/**
 * Coffee dashboard data
 *
 * Coffee consumption, caffeine modeling, and brew methods data
 */

import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_KEYS } from "@/lib/constants/cache";
import { startOfBerlinDayISO, endOfBerlinDayISO } from "@/lib/time/berlin";
import {
  qCupsToday,
  qBrewMethodsToday,
  qCoffeeOriginThisWeek,
  qCoffeeLast30Days,
  qCoffeeEventsForDayWithLookback,
} from "@/lib/db/queries";
import { getBodyProfile } from "@/lib/user/profile";
import { modelCaffeine } from "@/lib/phys/caffeine";

/**
 * Get coffee-specific dashboard data
 * Cached separately with COFFEE tag
 */
export const getCoffeeDashboardData = unstable_cache(
  async () => {
    const [
      cupsToday,
      brewMethodsToday,
      origins7d,
      coffeeLast30Days,
      body,
    ] = await Promise.all([
      qCupsToday(),
      qBrewMethodsToday(),
      qCoffeeOriginThisWeek(),
      qCoffeeLast30Days(30),
      getBodyProfile(),
    ]);

    // Caffeine model for today (00:00-24:00 Berlin time + lookback for decay calculation)
    const startISO = startOfBerlinDayISO(); // Today 00:00 Berlin (in UTC)
    const endISO = endOfBerlinDayISO(); // Tomorrow 00:00 Berlin (in UTC)
    const half = body.half_life_hours ?? 5;
    const lookbackH = Math.max(24, Math.ceil(half * 4));
    const events = await qCoffeeEventsForDayWithLookback(
      startISO,
      endISO,
      lookbackH
    );
    const caffeineSeries = modelCaffeine(events, body, {
      startMs: Date.parse(startISO),
      endMs: Date.parse(endISO),
      alignToHour: true, // Align grid points to Berlin hour boundaries
      gridMinutes: 60,
      halfLifeHours: body.half_life_hours ?? undefined,
    });

    return {
      cupsToday,
      brewMethodsToday,
      coffeeOriginThisWeek: origins7d,
      coffeeLast30Days,
      caffeineSeries,
    };
  },
  [CACHE_KEYS.COFFEE_DATA],
  {
    tags: [CACHE_TAGS.COFFEE],
    revalidate: 300, // 5 minutes
  }
);

export type CoffeeDashboardData = Awaited<ReturnType<typeof getCoffeeDashboardData>>;
