import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createListMetadata } from '@/lib/metadata';
import { CoffeeList, coffeePageCount } from '../../coffee-list';

type Props = { params: Promise<{ page: string }> };

function parsePage(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

export async function generateStaticParams() {
  const pages = await coffeePageCount();
  const extra = Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
  return extra.length > 0 ? extra : [{ page: '2' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page) ?? 1;
  return createListMetadata({
    title: `Coffee · Page ${page} | cr0ss.mind`,
    description: 'Explore my coffee collection from around the world.',
    path: `/coffee/page/${page}`,
  });
}

export default async function CoffeePagePaged({ params }: Props) {
  const page = parsePage((await params).page);
  if (page === null || page < 1) notFound();
  if (page === 1) redirect('/coffee');
  return <CoffeeList page={page} />;
}
