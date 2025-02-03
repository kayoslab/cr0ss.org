
import { notFound } from 'next/navigation';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { getBlogsForCategory } from '@/lib/contentful/api/category';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { Blog } from '@/components/blogarticle';
import type { Metadata, ResolvingMetadata } from 'next'
import { CategoryProps } from '@/lib/contentful/api/props/category';

type Props = {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const blog = await getBlog(params.slug);

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
  
  const result = new Array(amount);
  let len = arr.length,
      taken = new Array(len);

  while (amount--) {
    const x = Math.floor(Math.random() * len);
    result[amount] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
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
      return filterCurrent(blogs, blog.slug);
    }
  );
  
  // Resolve all promises and flatten the result to avoid nested arrays
  const relatedPosts = (await Promise.all(relatedPostsPromise)).flat();

  // Safeguard against empty or undefined related posts
  if (!relatedPosts || relatedPosts.length === 0) {
    const allBlogs = await getAllBlogs();
    const filteredBlogs = filterCurrent(allBlogs.items, blog.slug);

    if (allBlogs.items.length > 0) {
      // Show the newest blogs if no related posts exist.
      return allBlogs.items.slice(1, allBlogs.items.length > 3 ? 4 : allBlogs.items.length)
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
  const blog: BlogProps = await getBlog(params.slug);
  const recommendations: BlogProps[] = await getRecommendations(blog);

  if (!blog || !recommendations) {
    notFound();
  }

  // load the scripts asynchronously and wait for the promises to resolve/reject
  await Promise.allSettled([
    getBlog(params.slug),
    await getRecommendations(blog)
  ]).catch(error => console.error(error));

  return (
    <main className='flex min-h-screen flex-col items-center justify-between bg-white dark:bg-slate-800 pb-24'>
      <Blog blog={ blog } recommendations={ recommendations } />
    </main>
  );
}