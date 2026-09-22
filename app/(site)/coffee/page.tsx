import { Suspense } from 'react';
import { getAllCoffee } from '@/lib/contentful/api/coffee';
import { CoffeeProps } from '@/lib/contentful/api/props/coffee';
import CoffeeGrid from '@/components/coffee/coffee-grid';
import { COFFEE_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import BlogGridLoading from '../blog/loading';

export const metadata: Metadata = createListMetadata({
  title: 'Coffee | cr0ss.mind',
  description: 'Explore my coffee collection from around the world.',
  path: '/coffee',
});

type SearchParams = Promise<{ page?: string }>;

async function CoffeeList({ searchParams }: { searchParams: SearchParams }) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const coffeeCollection = await getAllCoffee(currentPage, COFFEE_PER_PAGE);

  return (
    <CoffeeGrid
      coffees={coffeeCollection.items as unknown as CoffeeProps[]}
      currentPage={currentPage}
      totalPages={Math.ceil(coffeeCollection.total / COFFEE_PER_PAGE)}
      basePath='/coffee'
      title='Coffee Collection'
    />
  );
}

export default function CoffeePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <Suspense fallback={<BlogGridLoading />}>
        <CoffeeList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
