import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  getBlogsForCategory,
  getCategory,
  getAllCategories,
} from '@/lib/contentful/api/category';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { CategoryProps } from '@/lib/contentful/api/props/category';
import BlogGrid from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import BlogGridLoading from '../../loading';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

// Pre-generate all category pages at build time
export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category: CategoryProps) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: Pick<Props, 'params'>): Promise<Metadata> {
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

async function CategoryList({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const currentPage = Number(page) || 1;
  const [category, blogCollection] = await Promise.all([
    getCategory(slug),
    getBlogsForCategory(slug, currentPage, POSTS_PER_PAGE),
  ]);

  if (!category || !blogCollection) {
    notFound();
  }

  return (
    <BlogGrid
      posts={blogCollection.items as unknown as BlogProps[]}
      currentPage={currentPage}
      totalPages={Math.ceil(blogCollection.total / POSTS_PER_PAGE)}
      basePath={`/blog/category/${slug}`}
      title={category.title}
    />
  );
}

export default function BlogCategoriesContent(props: Props) {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
      <Suspense fallback={<BlogGridLoading />}>
        <CategoryList {...props} />
      </Suspense>
    </main>
  );
}
