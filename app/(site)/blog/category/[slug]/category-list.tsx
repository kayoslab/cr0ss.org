import { notFound } from 'next/navigation';
import {
  getBlogsForCategory,
  getCategory,
} from '@/lib/contentful/api/category';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import BlogGrid from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';

/** Number of list pages for a category (at least 1). */
export async function categoryPageCount(slug: string): Promise<number> {
  const { total } = await getBlogsForCategory(slug, 1, POSTS_PER_PAGE);
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

/** One page of a category's posts; pagination is path-based (see BlogList). */
export async function CategoryList({
  slug,
  page,
}: {
  slug: string;
  page: number;
}) {
  const [category, collection] = await Promise.all([
    getCategory(slug),
    getBlogsForCategory(slug, page, POSTS_PER_PAGE),
  ]);
  if (!category) notFound();
  const totalPages = Math.max(1, Math.ceil(collection.total / POSTS_PER_PAGE));
  if (page > totalPages) notFound();

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <BlogGrid
        posts={collection.items as unknown as BlogProps[]}
        currentPage={page}
        totalPages={totalPages}
        basePath={`/blog/category/${slug}`}
        title={category.title}
      />
    </main>
  );
}
