'use client';

import { CoffeeProps } from '@/lib/contentful/api/props/coffee';
import { CountryProps } from '@/lib/contentful/api/props/country';
import MapClient from '@/components/map.client';
import {
  pathStartPoint as getPathStartPoint,
  compactSvgPath,
} from '@/lib/map/projection';
import Link from 'next/link';
import Image from 'next/image';
import Markdown from 'react-markdown';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';

interface CoffeeDetailProps {
  coffee: CoffeeProps;
  originCountry: CountryProps | null;
}

export default function CoffeeDetail({
  coffee,
  originCountry,
}: CoffeeDetailProps) {
  // The base map is a shared asset; only the origin country is shaded here.
  const highlighted = originCountry?.data?.path
    ? [{ id: originCountry.id, path: compactSvgPath(originCountry.data.path) }]
    : [];
  const pathStartPoint = originCountry?.data?.path
    ? getPathStartPoint(originCountry.data.path)
    : null;

  return (
    <div className='mx-auto w-full max-w-7xl'>
      <div className='space-y-12 px-4 py-16 md:px-6'>
        {/* Back link */}
        <Link
          href='/coffee'
          className='mb-8 inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='mr-1 h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
          Back to Coffee Collection
        </Link>

        {/* Header */}
        <div className='mb-8'>
          <h1 className='mb-2 text-4xl font-bold'>{coffee.name}</h1>
          <div className='flex items-center gap-2'>
            <p className='text-xl text-neutral-600'>{coffee.roaster}</p>
            {coffee.url && (
              <a
                href={coffee.url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-neutral-500 transition-colors hover:text-neutral-900'
                aria-label={`Visit ${coffee.roaster} website`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                  />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Map Section */}
        {originCountry && (
          <div className='mb-12'>
            <h2 className='mb-4 text-2xl font-semibold'>Origin</h2>
            {highlighted.length > 0 ? (
              <div className='relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm'>
                <div className='p-4'>
                  <MapClient
                    lat={0}
                    lon={0}
                    highlighted={highlighted}
                    showLocation={false}
                    className='h-auto w-full'
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
                <div className='absolute top-8 left-8 rounded-lg border border-neutral-200 bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm'>
                  <p className='text-lg font-semibold text-neutral-900'>
                    {originCountry.name}
                  </p>
                  {coffee.region && (
                    <p className='text-sm text-neutral-600'>{coffee.region}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-6'>
                <p className='text-lg font-semibold text-neutral-900'>
                  {originCountry.name}
                </p>
                {coffee.region && (
                  <p className='mt-1 text-sm text-neutral-600'>
                    {coffee.region}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Details Grid */}
        <div className='mb-12 grid grid-cols-1 gap-8 md:grid-cols-2'>
          {/* Coffee Details */}
          <div className='space-y-6'>
            <div>
              <h3 className='mb-2 text-lg font-semibold'>Details</h3>
              <dl className='space-y-2'>
                {coffee.farmer && (
                  <div>
                    <dt className='inline text-sm text-neutral-500'>Farmer:</dt>{' '}
                    <dd className='inline text-sm'>{coffee.farmer}</dd>
                  </div>
                )}
                {coffee.farm && (
                  <div>
                    <dt className='inline text-sm text-neutral-500'>Farm:</dt>{' '}
                    <dd className='inline text-sm'>{coffee.farm}</dd>
                  </div>
                )}
                {coffee.process && (
                  <div>
                    <dt className='inline text-sm text-neutral-500'>
                      Process:
                    </dt>{' '}
                    <dd className='inline text-sm'>{coffee.process}</dd>
                  </div>
                )}
                {coffee.variety && (
                  <div>
                    <dt className='inline text-sm text-neutral-500'>
                      Variety:
                    </dt>{' '}
                    <dd className='inline text-sm'>{coffee.variety}</dd>
                  </div>
                )}
                {coffee.scaScore && (
                  <div>
                    <dt className='inline text-sm text-neutral-500'>
                      SCA Score:
                    </dt>{' '}
                    <dd className='inline text-sm font-semibold'>
                      {coffee.scaScore}/100
                    </dd>
                  </div>
                )}
                {coffee.decaffeinated !== null &&
                  coffee.decaffeinated !== undefined && (
                    <div>
                      <dt className='inline text-sm text-neutral-500'>
                        Caffeine:
                      </dt>{' '}
                      <dd className='inline text-sm'>
                        {coffee.decaffeinated ? 'Decaffeinated' : 'Caffeinated'}
                      </dd>
                    </div>
                  )}
              </dl>
            </div>

            {coffee.tastingNotes && coffee.tastingNotes.length > 0 && (
              <div>
                <h3 className='mb-2 text-lg font-semibold'>Tasting Notes</h3>
                <div className='flex flex-wrap gap-2'>
                  {coffee.tastingNotes.map((note, index) => (
                    <span
                      key={index}
                      className='inline-block rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700'
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Photo & Brewing Recipe & Notes */}
          <div className='space-y-6'>
            {coffee.photo?.url && (
              <div className='overflow-hidden rounded-xl border border-neutral-200 shadow-sm'>
                <Image
                  src={optimizeWithPreset(coffee.photo.url, 'gridThumbnail')}
                  alt={coffee.photo.title || coffee.name}
                  width={350}
                  height={263}
                  className='h-auto w-full object-cover'
                />
              </div>
            )}

            {coffee.brewingRecipe ? (
              <div>
                <h3 className='mb-2 text-lg font-semibold'>Brewing Recipe</h3>
                <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-4'>
                  <div className='prose prose-sm prose-neutral prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 max-w-none'>
                    <Markdown
                      components={{
                        p: ({ children }) => (
                          <p className='my-2 leading-relaxed'>{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className='my-2 list-disc pl-5'>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className='my-2 list-decimal pl-5'>{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className='my-1'>{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className='font-semibold'>{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className='italic'>{children}</em>
                        ),
                        h1: ({ children }) => (
                          <h1 className='mt-4 mb-2 text-lg font-bold'>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className='mt-3 mb-2 text-base font-bold'>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className='mt-2 mb-1 text-sm font-bold'>
                            {children}
                          </h3>
                        ),
                      }}
                    >
                      {coffee.brewingRecipe}
                    </Markdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className='rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center text-neutral-400'>
                <p className='text-sm'>Brewing recipe coming soon</p>
              </div>
            )}

            <div className='rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center text-neutral-400'>
              <p className='text-sm'>Personal notes coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
