import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getCategory, getAllCategories } from '@/lib/contentful/api/category';
import { CategoryProps } from '@/lib/contentful/api/props/category';
import { BlogGridSkeleton } from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import { CategoryList } from './category-list';

type Props = { params: Promise<{ slug: string }> };

// Pre-generate all category pages at build time
export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category: CategoryProps) => ({ slug: category.slug }));
}

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
    return { title: 'Category Error', description: 'Error loading category' };
  }
}

async function FirstPage({ params }: Props) {
  const { slug } = await params;
  return <CategoryList slug={slug} page={1} />;
}

// Page 1 of a category. Listed slugs are prerendered in full; an unlisted
// slug streams into the skeleton. Further pages live at ./page/[page].
export default function BlogCategoriesContent(props: Props) {
  return (
    <Suspense
      fallback={
        <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
          <BlogGridSkeleton count={POSTS_PER_PAGE} />
        </main>
      }
    >
      <FirstPage {...props} />
    </Suspense>
  );
}
