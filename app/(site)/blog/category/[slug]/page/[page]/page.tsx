import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAllCategories, getCategory } from '@/lib/contentful/api/category';
import { CategoryProps } from '@/lib/contentful/api/props/category';
import { BlogGridSkeleton } from '@/components/blog/blog-grid';
import { POSTS_PER_PAGE } from '@/lib/constants';
import { createListMetadata } from '@/lib/metadata';
import { CategoryList, categoryPageCount } from '../../category-list';

type Props = { params: Promise<{ slug: string; page: string }> };

function parsePage(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

// Every category page beyond the first; falls back to one (not-found) param
// because the build requires at least one.
export async function generateStaticParams() {
  const categories = (await getAllCategories()) as CategoryProps[];
  const params: { slug: string; page: string }[] = [];
  for (const category of categories) {
    const pages = await categoryPageCount(category.slug);
    for (let page = 2; page <= pages; page++)
      params.push({ slug: category.slug, page: String(page) });
  }
  return params.length > 0
    ? params
    : [{ slug: categories[0]?.slug ?? 'none', page: '2' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page: rawPage } = await params;
  const page = parsePage(rawPage) ?? 1;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category Not Found' };
  return createListMetadata({
    title: `${category.title} · Page ${page} | Blog | cr0ss.mind`,
    description: `Explore articles about ${category.title} from Simon Krüger's blog.`,
    path: `/blog/category/${slug}/page/${page}`,
  });
}

async function PagedList({ params }: Props) {
  const { slug, page: rawPage } = await params;
  const page = parsePage(rawPage);
  if (page === null || page < 1) notFound();
  if (page === 1) redirect(`/blog/category/${slug}`);
  return <CategoryList slug={slug} page={page} />;
}

export default function CategoryPagePaged(props: Props) {
  return (
    <Suspense
      fallback={
        <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
          <BlogGridSkeleton count={POSTS_PER_PAGE} />
        </main>
      }
    >
      <PagedList {...props} />
    </Suspense>
  );
}
