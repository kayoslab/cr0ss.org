import { notFound } from 'next/navigation';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { getBlogsForCategory } from '@/lib/contentful/api/category';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { Blog } from '@/components/blog/blogarticle';
import type { Metadata, ResolvingMetadata } from 'next'
import { CategoryProps } from '@/lib/contentful/api/props/category';
import { useEffect, useState } from 'react';
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

function getRandom(arr: any[], amount: number = 3) {
  if (amount > arr.length) amount = arr.length;
  
  // Create a copy of the array to avoid modifying the original
  const available = [...arr];
  const result = [];

  while (result.length < amount && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    // Remove and get the item at randomIndex
    const [item] = available.splice(randomIndex, 1);
    result.push(item);
  }

  return result;
}

function filterCurrent(arr: BlogProps[], slug: string) {
  const filteredBlogs = arr.reduce((acc: BlogProps[], post: BlogProps) => {
    if (post.slug !== slug) {
      acc.push(post);
    }
    return acc;
  }, []);
  return filteredBlogs;
}

async function getRecommendations(blog: BlogProps) {
  const categorySlugs = blog.categoriesCollection.items.map((category: CategoryProps) => category.slug);
  
  const relatedPostsPromise = categorySlugs.map(
    async (slug: string): Promise<BlogProps[]> => {
      const blogs = await getBlogsForCategory(slug);
      return filterCurrent(blogs.items, blog.slug);
    }
  );
  
  // Resolve all promises and flatten the result to avoid nested arrays
  const relatedPosts = (await Promise.all(relatedPostsPromise)).flat();

  // Safeguard against empty or undefined related posts
  if (!relatedPosts || relatedPosts.length === 0) {
    const allBlogs = await getAllBlogs();
    const filteredBlogs = filterCurrent(allBlogs.items, blog.slug);

    if (filteredBlogs.length > 0) {
      // Show the newest blogs if no related posts exist.
      return filteredBlogs.slice(1, filteredBlogs.length > 3 ? 4 : filteredBlogs.length)
    }
    // No blogs exist, so nothing to recommend.
    return [];
  }

  // Pass resolved posts to getRandom
  const random = getRandom(relatedPosts);

  return random;
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