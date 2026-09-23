import React from 'react';
import { getLocation } from '@/lib/dashboard/location';
import { getCountries } from '@/lib/dashboard/countries';
import TravelClient from './travel.client';
import { compactSvgPath } from '@/lib/map/projection';

export const metadata = {
  title: 'Travel | Dashboard',
  description: 'Travel history and visited countries around the world',
};

export default async function TravelPage() {
  const [locationData, allCountries] = await Promise.all([
    getLocation(),
    getCountries('all'),
  ]);

  // `all` lists visited countries first, most recent first.
  const visited = allCountries.countries.filter((c) => c.visited);

  return (
    <div className='w-full space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Travel</h2>
        <p className='text-muted-foreground'>
          Travel history and countries visited around the world.
        </p>
      </div>

      <TravelClient
        totalCountries={allCountries.total}
        visitedCount={allCountries.visited_count}
        recentVisited={visited
          .slice(0, 5)
          .map((c) => ({ id: c.id, name: c.name }))}
        countries={visited.map((c) => ({
          id: c.id,
          path: compactSvgPath(c.path),
        }))}
        lat={locationData?.latitude ?? 0}
        lon={locationData?.longitude ?? 0}
        hasLocation={locationData != null}
      />
    </div>
  );
}
