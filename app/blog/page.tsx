import { getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import generateRssFeed from '@/utils/rss';
import Image from 'next/image';
import Link from 'next/link';

export default async function BlogsContent() {
  const blogs = await getAllBlogs();

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800 pb-24'>
      <section className='w-full pt-12 max-w-screen-lg'>
        <div className='container mx-auto space-y-12 px-4 md:px-6'>
          <div className='flex flex-col items-center justify-center space-y-4 text-center'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl'>
                Blog
              </h1>
            </div>
          </div>
          <div className='space-y-12'>
            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
              {blogs?.map((blog: BlogProps) => (
                <article
                  key={blog.sys.id}
                  className='flex h-full flex-col overflow-hidden rounded-lg shadow-lg'
                >
                  <Link href={`/blog/${blog.slug}`}>
                    <Image
                      alt='placeholder'
                      className='aspect-[4/3] w-full object-cover'
                      height='263'
                      src={blog?.heroImage?.url ?? ''}
                      width='350'
                    />
                  </Link>
                  <div className='flex-1 p-6'>
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className='py-4 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50'>
                        {blog.title}
                      </h3>
                    </Link>
                    <p className='mb-2 mt-4 max-w-none text-sm text-zinc-500 dark:text-zinc-400'>
                      {blog.summary}
                    </p>
                    <div className='flex justify-end'>
                      <Link
                        className='inline-flex h-10 items-center justify-center text-sm font-medium'
                        href={`/blog/${blog.slug}`}
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}