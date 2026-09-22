import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllPages, getPage } from '@/lib/contentful/api/page';
import { PageProps } from '@/lib/contentful/api/props/page';
import { Page } from '@/components/page/page';
import { createPageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const page = (await getPage(slug)) as unknown as PageProps;
    if (!page) {
      return {
        title: 'Page Not Found',
        description: 'The requested page could not be found',
      };
    }

    return createPageMetadata({
      title: `${page.title} | cr0ss.mind`,
      description: `${page.title} - Personal page on cr0ss.org`,
      slug: page.slug,
      heroImageUrl: page.heroImage?.url,
    });
  } catch (error) {
    console.error('Error generating page metadata:', error);
    return {
      title: 'Page Error',
      description: 'Error loading page',
    };
  }
}

// At build time, fetch all slugs to build the blog pages so they are static and cached
export async function generateStaticParams() {
  const allPages = await getAllPages();
  return (allPages as unknown as PageProps[])?.map((page: PageProps) => ({
    slug: page.slug,
  }));
}

async function PageBody({ params }: Props) {
  const { slug } = await params;
  const page = (await getPage(slug)) as unknown as PageProps;

  if (!page) {
    notFound();
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <Page page={page} />
    </main>
  );
}

function ContentLoading() {
  return (
    <main className='flex min-h-screen flex-col items-center bg-white pb-24'>
      <div className='w-full max-w-3xl space-y-6 px-6 pt-10 lg:px-8'>
        <Skeleton className='h-10 w-3/4' />
        <Skeleton className='h-6 w-1/2' />
        <Skeleton className='aspect-video w-full rounded-xl' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
      </div>
    </main>
  );
}

export default function PageContent({ params }: Props) {
  return (
    <Suspense fallback={<ContentLoading />}>
      <PageBody params={params} />
    </Suspense>
  );
}
