
import { notFound } from 'next/navigation';
import { getAllPages, getPage } from '@/lib/contentful/api/page';
import { PageProps } from '@/lib/contentful/api/props/page';
import { Page } from '@/components/page';

// At build time, fetch all slugs to build the blog pages so they are static and cached
export async function generateStaticParams() {
  const allBlogs = await getAllPages();
  return allBlogs.map((blog: PageProps) => ({
    slug: blog.slug,
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
    <main className='flex min-h-screen flex-col items-center justify-between bg-white p-24'>
      <section className='w-full'>
        <div className='container space-y-12 px-4 md:px-6'>
          <Page page={page} />
        </div>
      </section>
    </main>
  );
}