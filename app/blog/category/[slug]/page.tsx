import { notFound } from 'next/navigation';
import { getBlogsForCategory, getCategory } from '@/lib/contentful/api/category';
import BlogGrid from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const category = await getCategory(slug);
    if (!category) {
      return {
        title: 'Category Not Found',
        description: 'The requested category could not be found',
      };
    }

    return createListMetadata({
      title: `${category.title} | Blog | cr0ss.mind`,
      description: `Explore articles about ${category.title} from Simon Krüger's blog.`,
      path: `/blog/category/${slug}`,
    });
  } catch (error) {
    console.error('Error generating category metadata:', error);
    return {
      title: 'Category Error',
      description: 'Error loading category',
    };
  }
}

export default async function BlogCategoriesContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const category = await getCategory(slug);
  const blogCollection = await getBlogsForCategory(slug, currentPage, POSTS_PER_PAGE);
  
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
        basePath={`/blog/category/${slug}`}
        title={category.title}
      />
    </main>
  );
}