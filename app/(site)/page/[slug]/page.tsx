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
    <main
      className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'
      aria-busy='true'
    >
      <section className='mx-auto w-full max-w-7xl'>
        <div className='space-y-12 px-4 md:px-6'>
          <div className='space-y-4'>
            <Skeleton className='h-10 w-2/3 sm:h-12' />
          </div>
          <div className='space-y-8 lg:space-y-10'>
            <Skeleton className='aspect-video w-full rounded-xl' />
            <div className='space-y-6'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-full md:h-6' />
                  <Skeleton className='h-5 w-4/5 md:h-6' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
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
