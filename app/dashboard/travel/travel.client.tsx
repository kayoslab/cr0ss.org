'use client';

import React from 'react';
import Link from 'next/link';
import MapClient, { HighlightedCountry } from '@/components/map.client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Donut } from '@/components/dashboard/charts/shadcn-charts';

type TravelClientProps = {
  totalCountries: number;
  visitedCount: number;
  recentVisited: { id: string; name: string }[];
  /** Visited countries (the ones shaded on the map). */
  countries: HighlightedCountry[];
  lat: number;
  lon: number;
  hasLocation: boolean;
};

export default function TravelClient({
  totalCountries,
  visitedCount,
  recentVisited,
  countries,
  lat,
  lon,
  hasLocation,
}: TravelClientProps) {
  return (
    <div className='space-y-6'>
      {/* Map */}
      <div className='rounded-xl border border-neutral-200/60 shadow-sm'>
        <div className='p-2 sm:p-3 md:p-4'>
          <MapClient
            lat={lat}
            lon={lon}
            highlighted={countries}
            showLocation={hasLocation}
            className='block h-auto w-full'
          />
        </div>
      </div>

      {/* Travel Stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Visited Countries</CardDescription>
            <CardTitle className='text-4xl'>{visitedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm'>
              {Math.round((visitedCount / totalCountries) * 100)}% of world
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Last Visited</CardDescription>
            <CardTitle className='text-4xl'>
              {recentVisited.length ? recentVisited[0].name : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisited.length > 1 ? (
              <div className='space-y-1'>
                {recentVisited.slice(1).map((c) => (
                  <div key={c.id} className='text-muted-foreground text-sm'>
                    {c.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                {recentVisited.length === 0
                  ? 'No visits yet'
                  : 'Most recent visit'}
              </p>
            )}
          </CardContent>
        </Card>

        <Donut
          title='Countries'
          data={[
            { name: 'Visited', value: visitedCount },
            {
              name: 'Not Visited',
              value: Math.max(0, totalCountries - visitedCount),
            },
          ]}
        />
      </div>

      {/* Link to Collection */}
      <div className='gap-4'>
        <Link
          href='/blog/category/travel'
          className='inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-200'
        >
          View Travel Blog
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 5l7 7-7 7'
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
