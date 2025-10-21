import { notFound } from 'next/navigation';
import { getBlogsForCategory, getCategory, getAllCategories } from '@/lib/contentful/api/category';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { CategoryProps } from '@/lib/contentful/api/props/category';
import BlogGrid from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import { cache } from 'react';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

// Revalidate the page every hour
export const revalidate = 3600;

// Cache the category data to avoid duplicate API calls between generateMetadata and page render
const getCategoryData = cache(async (slug: string, page: number) => {
  const [category, blogCollection] = await Promise.all([
    getCategory(slug),
    getBlogsForCategory(slug, page, POSTS_PER_PAGE)
  ]);
  return { category, blogCollection };
});

// Pre-generate all category pages at build time
export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category: CategoryProps) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    // For metadata, we don't need pagination, so we use page 1
    const { category } = await getCategoryData(slug, 1);
    
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
  const { category, blogCollection } = await getCategoryData(slug, currentPage);

  if (!category || !blogCollection) {
    notFound();
  }

  const totalPosts = blogCollection.total;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPosts = blogCollection.items as unknown as BlogProps[];

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