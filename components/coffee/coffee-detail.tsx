'use client';

import { CoffeeyProps } from '@/lib/contentful/api/props/coffee';
import { CountryProps } from '@/lib/contentful/api/props/country';
import MapClient from '@/components/map.client';
import Link from 'next/link';
import Image from 'next/image';
import Markdown from 'react-markdown';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';

interface CoffeeDetailProps {
  coffee: CoffeeyProps;
  originCountry: CountryProps | null;
  allCountries: CountryProps[];
}

export default function CoffeeDetail({ coffee, originCountry, allCountries }: CoffeeDetailProps) {
  // Debug logging
  console.log('Coffee country:', coffee.country);
  console.log('Origin country:', originCountry);
  console.log('All countries count:', allCountries.length);

  // Prepare map data - show all countries, highlight only the origin
  const countries = allCountries.map((country) => ({
    id: country.id,
    path: country.data?.path ?? '',
    visited: originCountry ? country.sys.id === originCountry.sys.id : false,
  })).filter(c => c.path); // Only include countries with path data

  // Extract the first coordinate from the SVG path for the line connection
  const getPathStartPoint = (path: string) => {
    // Match the first M (move) command in the SVG path
    const match = path.match(/M\s*([-\d.]+)[,\s]+([-\d.]+)/);
    if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    }
    return null;
  };

  const pathStartPoint = originCountry?.data?.path ? getPathStartPoint(originCountry.data.path) : null;

  return (
    <div className="w-full max-w-(--breakpoint-lg)">
      <div className="container space-y-12 px-4 md:px-6 py-16">
      {/* Back link */}
      <Link
        href="/coffee"
        className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Coffee Collection
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{coffee.name}</h1>
        <p className="text-xl text-neutral-600">{coffee.roaster}</p>
      </div>

      {/* Map Section */}
      {originCountry && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Origin</h2>
          {countries.length > 0 ? (
            <div className="relative border border-neutral-200 rounded-xl shadow-sm overflow-hidden bg-white">
              <div className="p-4">
                <MapClient
                  lat={0}
                  lon={0}
                  countries={countries}
                  showLocation={false}
                  className="w-full h-auto"
                  labelLine={
                    pathStartPoint
                      ? {
                          from: pathStartPoint,
                          to: { x: 100, y: 100 }, // Position for white label area
                          label: originCountry?.name || '',
                        }
                      : null
                  }
                />
              </div>

              {/* Country label overlay */}
              <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-neutral-200">
                <p className="text-lg font-semibold text-neutral-900">{originCountry.name}</p>
                {coffee.region && (
                  <p className="text-sm text-neutral-600">{coffee.region}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 border border-neutral-200 rounded-lg bg-neutral-50">
              <p className="text-lg font-semibold text-neutral-900">{originCountry.name}</p>
              {coffee.region && (
                <p className="text-sm text-neutral-600 mt-1">{coffee.region}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Coffee Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Details</h3>
            <dl className="space-y-2">
              {coffee.farmer && (
                <div>
                  <dt className="text-sm text-neutral-500 inline">Farmer:</dt>{' '}
                  <dd className="text-sm inline">{coffee.farmer}</dd>
                </div>
              )}
              {coffee.farm && (
                <div>
                  <dt className="text-sm text-neutral-500 inline">Farm:</dt>{' '}
                  <dd className="text-sm inline">{coffee.farm}</dd>
                </div>
              )}
              {coffee.process && (
                <div>
                  <dt className="text-sm text-neutral-500 inline">Process:</dt>{' '}
                  <dd className="text-sm inline">{coffee.process}</dd>
                </div>
              )}
              {coffee.variety && (
                <div>
                  <dt className="text-sm text-neutral-500 inline">Variety:</dt>{' '}
                  <dd className="text-sm inline">{coffee.variety}</dd>
                </div>
              )}
              {coffee.scaScore && (
                <div>
                  <dt className="text-sm text-neutral-500 inline">SCA Score:</dt>{' '}
                  <dd className="text-sm inline font-semibold">{coffee.scaScore}/100</dd>
                </div>
              )}
              {coffee.decaffeinated !== null && coffee.decaffeinated !== undefined && (
                <div>
                  <dt className="text-sm text-neutral-500 inline">Caffeine:</dt>{' '}
                  <dd className="text-sm inline">{coffee.decaffeinated ? 'Decaffeinated' : 'Caffeinated'}</dd>
                </div>
              )}
            </dl>
          </div>

          {coffee.tastingNotes && coffee.tastingNotes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Tasting Notes</h3>
              <div className="flex flex-wrap gap-2">
                {coffee.tastingNotes.map((note, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Photo & Brewing Recipe & Notes */}
        <div className="space-y-6">
          {coffee.photo?.url && (
            <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
              <Image
                src={optimizeWithPreset(coffee.photo.url, 'gridThumbnail')}
                alt={coffee.photo.title || coffee.name}
                width={350}
                height={263}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {coffee.brewingRecipe ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Brewing Recipe</h3>
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="prose prose-sm prose-neutral max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                  <Markdown
                    components={{
                      p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
                      li: ({ children }) => <li className="my-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                    }}
                  >
                    {coffee.brewingRecipe}
                  </Markdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-neutral-200 rounded-lg text-center text-neutral-400">
              <p className="text-sm">Brewing recipe coming soon</p>
            </div>
          )}

          <div className="p-6 border-2 border-dashed border-neutral-200 rounded-lg text-center text-neutral-400">
            <p className="text-sm">Personal notes coming soon</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
