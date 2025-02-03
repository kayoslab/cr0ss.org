import { getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import Image from 'next/image';
import Link from 'next/link';

const POSTS_PER_PAGE = 9;

export default async function BlogsContent({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const blogCollection = await getAllBlogs(currentPage, POSTS_PER_PAGE);
  
  // Calculate pagination values using Contentful's response
  const totalPosts = blogCollection.total;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPosts = blogCollection.items;

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
              {currentPosts?.map((blog: BlogProps) => (
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

            {/* Pagination Controls */}
            <div className="flex justify-center gap-2 pt-8">
              {currentPage > 1 && (
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Previous
                </Link>
              )}
              
              <span className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Page {currentPage} of {totalPages}
              </span>

              {currentPage < totalPages && (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}