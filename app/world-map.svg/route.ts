import { cacheLife, cacheTag } from 'next/cache';
import { getAllCountries } from '@/lib/contentful/api/country';
import type { CountryProps } from '@/lib/contentful/api/props/country';
import { MAP_HEIGHT, MAP_WIDTH } from '@/lib/map/projection';
import { tags } from '@/lib/cache/tags';

/**
 * The base world map as one cacheable asset. Every country's SVG path lives
 * here (≈400 KB of path data) instead of in the RSC payload of each page that
 * shows a map; pages overlay only the countries they highlight.
 */
async function buildWorldMap(): Promise<string> {
  'use cache';
  cacheLife('content');
  cacheTag(tags.content.countries);

  const countries = (await getAllCountries()) as unknown as CountryProps[];
  const paths = countries
    .filter((c) => c.data?.path)
    .map((c) => `<path id="${c.id}" d="${c.data.path}"/>`)
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" ` +
    `fill="#ececec" stroke="#666666" stroke-width=".1" stroke-linecap="round" stroke-linejoin="round">` +
    paths +
    `</svg>`
  );
}

export async function GET() {
  return new Response(await buildWorldMap(), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control':
        'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
