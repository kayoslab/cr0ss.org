import type { Metadata } from 'next';
import { createListMetadata } from '@/lib/metadata';
import { CoffeeList } from './coffee-list';

export const metadata: Metadata = createListMetadata({
  title: 'Coffee | cr0ss.mind',
  description: 'Explore my coffee collection from around the world.',
  path: '/coffee',
});

// Page 1 of the collection, fully prerendered. Further pages: /coffee/page/[page].
export default function CoffeePage() {
  return <CoffeeList page={1} />;
}
