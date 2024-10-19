
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/contentful/api/page';
import { Page } from '@/components/page';

export default async function PageContent({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800'>
      <Page page={page} />
    </main>
  );
}