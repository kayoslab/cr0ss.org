import { BlogProps } from '@/lib/contentful/api/props/blog';
import Image from 'next/image';
import Link from 'next/link';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';

interface BlogGridProps {
  posts: BlogProps[];
  currentPage: number;
  totalPages: number;
  basePath: string;
  title: string;
}

export default function BlogGrid({ posts, currentPage, totalPages, basePath, title }: BlogGridProps) {
  return (
    <section className='w-full max-w-7xl mx-auto'>
      <div className='space-y-12 px-4 md:px-6'>
        <div className='space-y-4'>
          <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl'>
            {title}
          </h1>
        </div>
        <div className='space-y-12'>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {posts?.map((blog: BlogProps) => {
              const publishDate = new Date(blog.sys.firstPublishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              
              const optimizedImageUrl = optimizeWithPreset(blog?.heroImage?.url, 'gridThumbnail');
              
              return (
                <article
                  key={blog.sys.id}
                  className='flex h-full flex-col overflow-hidden rounded-lg shadow-lg'
                >
                  <Link href={`/blog/${blog.slug}`}>
                    <Image
                      alt={blog.title}
                      className='aspect-4/3 w-full object-cover'
                      height={450}
                      src={optimizedImageUrl}
                      width={600}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={false}
                    />
                  </Link>
                  <div className='flex-1 p-6'>
                    <div className='text-sm text-zinc-500'>
                      {publishDate}
                    </div>
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className='py-4 text-2xl font-bold leading-tight text-zinc-900'>
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
                className="px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-md hover:bg-zinc-200:bg-zinc-700"
              >
                Previous
              </Link>
            )}
            
            <span className="px-4 py-2 text-sm font-medium text-zinc-900">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages && (
              <Link
                href={`${basePath}?page=${currentPage + 1}`}
                className="px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-md hover:bg-zinc-200:bg-zinc-700"
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