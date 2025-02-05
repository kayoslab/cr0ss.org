import { getAllBlogs } from '@/lib/contentful/api/blog';
import BlogGrid from '@/components/blog-grid';

const POSTS_PER_PAGE = 9;

export default async function BlogsContent({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const blogCollection = await getAllBlogs(currentPage, POSTS_PER_PAGE);
  
  const totalPosts = blogCollection.total;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPosts = blogCollection.items;

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800 pb-24'>
      <BlogGrid
        posts={currentPosts}
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/blog"
        title="Blog"
      />
    </main>
  );
}