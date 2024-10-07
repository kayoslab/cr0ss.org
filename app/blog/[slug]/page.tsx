
import { notFound } from 'next/navigation';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { Blog } from '@/components/blogarticle';

// At build time, fetch all slugs to build the blog pages so they are static and cached
export async function generateStaticParams() {
  const allBlogs = await getAllBlogs();
  return allBlogs.map((blog: BlogProps) => ({
    slug: blog.slug,
  }));
}

export default async function BlogContent({
  params,
}: {
  params: { slug: string };
}) {
  const blog = await getBlog(params.slug);

  console.log(blog);

  if (!blog) {
    notFound();
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white p-24'>
      <section className='w-full'>
        <div className='container space-y-12 px-4 md:px-6'>
          <Blog blog={blog} />
        </div>
      </section>
    </main>
  );
}