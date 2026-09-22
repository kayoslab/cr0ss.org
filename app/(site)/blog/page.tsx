import { Suspense } from 'react';
import { getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import BlogGrid from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import BlogGridLoading from './loading';

export const metadata: Metadata = createListMetadata({
  title: 'Blog | cr0ss.mind',
  description:
    'Explore articles on software development, technology, and personal insights from Simon Krüger.',
  path: '/blog',
});

type SearchParams = Promise<{ page?: string }>;

// The page number comes from the URL, so this part streams in; the posts
// themselves are cached (fetchGraphQL) and invalidated by the Contentful webhook.
async function BlogList({ searchParams }: { searchParams: SearchParams }) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const blogCollection = await getAllBlogs(currentPage, POSTS_PER_PAGE);

  return (
    <BlogGrid
      posts={blogCollection.items as unknown as BlogProps[]}
      currentPage={currentPage}
      totalPages={Math.ceil(blogCollection.total / POSTS_PER_PAGE)}
      basePath='/blog'
      title='Blog'
    />
  );
}

export default function BlogsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <Suspense fallback={<BlogGridLoading />}>
        <BlogList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
