import { notFound } from 'next/navigation';
import { getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import BlogGrid from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';

/** Number of blog list pages (at least 1). */
export async function blogPageCount(): Promise<number> {
  const { total } = await getAllBlogs(1, POSTS_PER_PAGE);
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

/**
 * One page of the blog list. Pagination is path-based (/blog, /blog/page/2)
 * so every page is prerenderable; a `?page=` search param would push the
 * whole list to request time.
 */
export async function BlogList({ page }: { page: number }) {
  const collection = await getAllBlogs(page, POSTS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(collection.total / POSTS_PER_PAGE));
  if (page > totalPages) notFound();

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <BlogGrid
        posts={collection.items as unknown as BlogProps[]}
        currentPage={page}
        totalPages={totalPages}
        basePath='/blog'
        title='Blog'
      />
    </main>
  );
}
