import { notFound } from 'next/navigation';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { getBlogsForCategory } from '@/lib/contentful/api/category';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { Blog } from '@/components/blog/blogarticle';
import type { Metadata } from 'next'
import { CategoryProps } from '@/lib/contentful/api/props/category';
import { BlogViewTracker } from '@/components/blog/blog-view-tracker';
import { createBlogMetadata, createBlogJsonLd } from '@/lib/metadata';
import { getRelatedPosts } from '@/lib/algolia/client';

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const blog = await getBlog(slug) as unknown as BlogProps;
    if (!blog) {
      return {
        title: 'Blog Not Found',
        description: 'The requested blog post could not be found'
      }
    }

    return createBlogMetadata({
      title: blog.title,
      description: blog.seoDescription || blog.summary,
      keywords: blog.seoKeywords,
      author: blog.author,
      slug: blog.slug,
      publishedTime: blog.sys.firstPublishedAt,
      heroImageUrl: blog.heroImage?.url,
      category: blog.categoriesCollection?.items[0]?.title,
    });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog Error',
      description: 'Error loading blog post'
    }
  }
}

// At build time, fetch all slugs to build the blog pages so they are static and cached
export async function generateStaticParams() {
  const allBlogs = await getAllBlogs();
  return (allBlogs.items as unknown as BlogProps[]).map((blog: BlogProps) => ({
    slug: blog.slug,
  }));
}

async function getRecommendations(currentBlog: BlogProps, maxRecommendations: number = 3): Promise<BlogProps[]> {
  try {
    // Try Algolia Recommend first
    const algoliaRecs = await getRelatedPosts(currentBlog.sys.id, maxRecommendations);

    if (algoliaRecs.length > 0) {
      // Fetch full blog data for each recommendation using slug directly
      const blogPromises = algoliaRecs
        .filter((rec) => rec.slug)
        .map(async (rec) => {
          return getBlog(rec.slug) as unknown as BlogProps | null;
        });

      const blogs = await Promise.all(blogPromises);
      const validBlogs = blogs.filter((blog): blog is BlogProps => blog !== null);

      if (validBlogs.length > 0) {
        return validBlogs.slice(0, maxRecommendations);
      }
    }

    // Fallback: category-based recommendations
    const categories = currentBlog.categoriesCollection?.items || [];

    if (categories && categories.length > 0) {
      const categoryPromises = categories.map((category: CategoryProps) =>
        getBlogsForCategory(category.slug)
      );
      const categoryResults = await Promise.all(categoryPromises);

      const blogMap = new Map<string, BlogProps>();

      categoryResults.flatMap(result => result.items as unknown as BlogProps[])
        .forEach((blog: BlogProps) => {
          if (blog.slug !== currentBlog.slug && !blogMap.has(blog.slug)) {
            blogMap.set(blog.slug, blog);
          }
        });

      const uniqueBlogs = Array.from(blogMap.values());
      if (uniqueBlogs.length > 0) {
        const shuffled = uniqueBlogs.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, maxRecommendations);
      }
    }

    // Final fallback: recent posts
    const recentPosts = await getAllBlogs(1, maxRecommendations + 1);
    return (recentPosts.items as unknown as BlogProps[])
      .filter((post: BlogProps) => post.slug !== currentBlog.slug)
      .slice(0, maxRecommendations);

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

export default async function BlogContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const blog = await getBlog(slug) as unknown as BlogProps;
    if (!blog) {
      notFound();
    }

    const recommendations = await getRecommendations(blog);

    const jsonLd = createBlogJsonLd({
      title: blog.title,
      description: blog.seoDescription || blog.summary,
      author: blog.author,
      slug: blog.slug,
      publishedTime: blog.sys.firstPublishedAt,
      heroImageUrl: blog.heroImage?.url,
    });

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <main className='flex min-h-screen flex-col items-center justify-between bg-white pb-24'>
          <BlogViewTracker blog={blog} />
          <Blog blog={blog} recommendations={recommendations} />
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading blog content:', error);
    notFound();
  }
}