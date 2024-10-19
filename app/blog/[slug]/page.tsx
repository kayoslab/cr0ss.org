
import { notFound } from 'next/navigation';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { Blog } from '@/components/blogarticle';
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const blog = await getBlog(params.slug);

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []
 
  return {
    title: blog.title,
    description: blog.seoDescription,
    keywords: blog.seoKeywords,
    openGraph: {
      title: blog.title,
      description: blog.seoDescription,
      images: [blog.heroImage?.url as string, ...previousImages],
      url: 'https://cr0ss.org/blog/' + blog.slug,
    },
    creator: blog.author,
    publisher: 'Simon Krüger',
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// At build time, fetch all slugs to build the blog pages so they are static and cached
export async function generateStaticParams() {
  const allBlogs = await getAllBlogs();
  return allBlogs.map((blog: BlogProps) => ({
    slug: blog.slug,
  }));
}

export default async function BlogContent({
  params,
}: {
  params: { slug: string };
}) {
  const blog = await getBlog(params.slug);

  if (!blog) {
    notFound();
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white p-24'>
      <section className='w-full'>
        <div className='container space-y-12 px-4 md:px-6'>
          <Blog blog={blog} />
        </div>
      </section>
    </main>
  );
}