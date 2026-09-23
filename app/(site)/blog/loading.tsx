import { BlogGridSkeleton } from '@/components/blog/blog-grid';

/** Loading state for the blog grid (list, category and search pages). */
export default function BlogGridLoading() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <BlogGridSkeleton />
    </main>
  );
}
