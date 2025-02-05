import { notFound } from 'next/navigation';
import { getBlogsForCategory, getCategory } from '@/lib/contentful/api/category';
import BlogGrid from '@/components/blog/blog-grid';

const POSTS_PER_PAGE = 9;

export default async function BlogCategoriesContent({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const category = await getCategory(params.slug);
  const blogCollection = await getBlogsForCategory(params.slug, currentPage, POSTS_PER_PAGE);
  
  if (!category || !blogCollection) {
    notFound();
  }

  const totalPosts = blogCollection.total;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPosts = blogCollection.items;

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800 pb-24'>
      <BlogGrid
        posts={currentPosts}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/blog/category/${params.slug}`}
        title={category.title}
      />
    </main>
  );
}