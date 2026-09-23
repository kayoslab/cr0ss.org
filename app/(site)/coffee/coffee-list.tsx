import { notFound } from 'next/navigation';
import { getAllCoffee } from '@/lib/contentful/api/coffee';
import { CoffeeProps } from '@/lib/contentful/api/props/coffee';
import CoffeeGrid from '@/components/coffee/coffee-grid';
import { COFFEE_PER_PAGE } from '@/lib/constants';

/** Number of coffee list pages (at least 1). */
export async function coffeePageCount(): Promise<number> {
  const { total } = await getAllCoffee(1, COFFEE_PER_PAGE);
  return Math.max(1, Math.ceil(total / COFFEE_PER_PAGE));
}

/** One page of the coffee collection; pagination is path-based (see BlogList). */
export async function CoffeeList({ page }: { page: number }) {
  const collection = await getAllCoffee(page, COFFEE_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(collection.total / COFFEE_PER_PAGE));
  if (page > totalPages) notFound();

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <CoffeeGrid
        coffees={collection.items as unknown as CoffeeProps[]}
        currentPage={page}
        totalPages={totalPages}
        basePath='/coffee'
        title='Coffee Collection'
      />
    </main>
  );
}
