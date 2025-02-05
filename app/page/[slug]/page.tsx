
import { notFound } from 'next/navigation';
import { getAllPages, getPage } from '@/lib/contentful/api/page';
import { PageProps } from '@/lib/contentful/api/props/page';
import { Page } from '@/components/page/page';

// At build time, fetch all slugs to build the blog pages so they are static and cached
export async function generateStaticParams() {
  const allPages = await getAllPages();
  return allPages?.map((page: PageProps) => ({
    slug: page.slug,
  }));
}

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
    <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800 pb-24'>
      <Page page={page} />
    </main>
  );
}