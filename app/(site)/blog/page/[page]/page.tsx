import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createListMetadata } from '@/lib/metadata';
import { BlogList, blogPageCount } from '../../blog-list';

type Props = { params: Promise<{ page: string }> };

function parsePage(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

// Prerender every page beyond the first. With a single page this yields
// `/blog/page/2`, which renders not-found — the build needs at least one param.
export async function generateStaticParams() {
  const pages = await blogPageCount();
  const extra = Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
  return extra.length > 0 ? extra : [{ page: '2' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page) ?? 1;
  return createListMetadata({
    title: `Blog · Page ${page} | cr0ss.mind`,
    description:
      'Explore articles on software development, technology, and personal insights from Simon Krüger.',
    path: `/blog/page/${page}`,
  });
}

export default async function BlogPagePaged({ params }: Props) {
  const page = parsePage((await params).page);
  if (page === null || page < 1) notFound();
  if (page === 1) redirect('/blog');
  return <BlogList page={page} />;
}
