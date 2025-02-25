import { notFound } from 'next/navigation';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { getBlogsForCategory } from '@/lib/contentful/api/category';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { Blog } from '@/components/blog/blogarticle';
import type { Metadata, ResolvingMetadata } from 'next'
import { CategoryProps } from '@/lib/contentful/api/props/category';
import { BlogViewTracker } from '@/components/blog/blog-view-tracker';

type Props = {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const blog = await getBlog(params.slug);
    if (!blog) {
      return {
        title: 'Blog Not Found',
        description: 'The requested blog post could not be found'
      }
    }

    // optionally access and extend (rather than replace) parent metadata
    const previousImages = (await parent).openGraph?.images || []
   
    return {
      title: blog.title,
      description: blog.seoDescription,
      keywords: blog.seoKeywords,
      openGraph: {
        title: blog.title,
        description: blog.seoDescription,
        images: [blog.heroImage?.url as string, ...previousImages],
        url: 'https://cr0ss.org/blog/' + blog.slug,
      },
      creator: blog.author,
      publisher: 'Simon Krüger',
      robots: {
        index: true,
        follow: true,
        nocache: true,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
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
  return allBlogs.items.map((blog: BlogProps) => ({
    slug: blog.slug,
  }));
}

async function getRecommendations(currentBlog: BlogProps, maxRecommendations: number = 3): Promise<BlogProps[]> {
  try {
    // Get all categories of the current blog
    const categories = currentBlog.categoriesCollection?.items || [];
    
    // If no categories or empty collection, return empty array
    if (!categories || categories.length <= 0) {
      return [];
    }

    // Get posts from all categories
    const categoryPromises = categories.map((category: CategoryProps) => 
      getBlogsForCategory(category.slug)
    );
    const categoryResults = await Promise.all(categoryPromises);
    
    // Flatten all blog posts and remove duplicates and current blog
    const allRelatedBlogs = Array.from(new Set(
      categoryResults.flatMap(result => result.items)
        .filter(blog => blog.slug !== currentBlog.slug)
    ));

    // Randomly select up to maxRecommendations posts
    const shuffled = allRelatedBlogs.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, maxRecommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

export default async function BlogContent({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const blog = await getBlog(params.slug);
    if (!blog) {
      notFound();
    }

    const recommendations = await getRecommendations(blog);

    return (
      <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800 pb-24'>
        <BlogViewTracker blog={blog} />
        <Blog blog={blog} recommendations={recommendations} />
      </main>
    );
  } catch (error) {
    console.error('Error loading blog content:', error);
    notFound();
  }
}