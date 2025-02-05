import { BlogProps } from '@/lib/contentful/api/props/blog';
import Image from 'next/image';
import Link from 'next/link';

interface BlogGridProps {
  posts: BlogProps[];
  currentPage: number;
  totalPages: number;
  basePath: string;
  title: string;
}

export default function BlogGrid({ posts, currentPage, totalPages, basePath, title }: BlogGridProps) {
  return (
    <section className='w-full pt-12 max-w-screen-lg'>
      <div className='container mx-auto space-y-12 px-4 md:px-6'>
        <div className='flex flex-col items-center justify-center space-y-4 text-center'>
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl'>
              {title}
            </h1>
          </div>
        </div>
        <div className='space-y-12'>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {posts?.map((blog: BlogProps) => {
              const publishDate = new Date(blog.sys.firstPublishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              
              return (
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
                    <div className='text-sm text-zinc-500 dark:text-zinc-400'>
                      {publishDate}
                    </div>
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className='py-4 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50'>
                        {blog.title}
                      </h3>
                    </Link>
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
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center gap-2 pt-8">
            {currentPage > 1 && (
              <Link
                href={`${basePath}?page=${currentPage - 1}`}
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
                href={`${basePath}?page=${currentPage + 1}`}
                className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}; 