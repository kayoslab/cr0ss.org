import type { Metadata } from 'next';
import { createListMetadata } from '@/lib/metadata';
import { BlogList } from './blog-list';

export const metadata: Metadata = createListMetadata({
  title: 'Blog | cr0ss.mind',
  description:
    'Explore articles on software development, technology, and personal insights from Simon Krüger.',
  path: '/blog',
});

// Page 1 of the blog, fully prerendered. Further pages live at /blog/page/[page].
export default function BlogsContent() {
  return <BlogList page={1} />;
}
