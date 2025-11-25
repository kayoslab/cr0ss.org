import { getAllCoffee } from '@/lib/contentful/api/coffee';
import { CoffeeyProps } from '@/lib/contentful/api/props/coffee';
import CoffeeGrid from '@/components/coffee/coffee-grid';
import { COFFEE_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

// Revalidate the page every hour
export const revalidate = 3600;

export const metadata: Metadata = createListMetadata({
  title: 'Coffee | cr0ss.mind',
  description: 'Explore my coffee collection from around the world.',
  path: '/coffee',
});

export default async function CoffeePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const coffeeCollection = await getAllCoffee(currentPage, COFFEE_PER_PAGE);

  const totalCoffees = coffeeCollection.total;
  const totalPages = Math.ceil(totalCoffees / COFFEE_PER_PAGE);
  const coffees = coffeeCollection.items as unknown as CoffeeyProps[];

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <CoffeeGrid
        coffees={coffees}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/coffee"
        title="Coffee Collection"
      />
    </main>
  );
}
