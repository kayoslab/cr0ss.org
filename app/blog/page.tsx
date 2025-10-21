import { getAllBlogs } from '@/lib/contentful/api/blog';
import BlogGrid from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = createListMetadata({
  title: 'Blog | cr0ss.mind',
  description: 'Explore articles on software development, technology, and personal insights from Simon Krüger.',
  path: '/blog',
});

export default async function BlogsContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
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