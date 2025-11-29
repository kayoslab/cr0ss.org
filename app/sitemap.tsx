import type { MetadataRoute } from 'next';
import { getAllBlogs } from '@/lib/contentful/api/blog';
import { getAllPages } from '@/lib/contentful/api/page';
import { getAllCategories } from '@/lib/contentful/api/category';
import { getAllCoffee } from '@/lib/contentful/api/coffee';
import { SITE_URL } from '@/lib/constants';
import type { BlogProps } from '@/lib/contentful/api/props/blog';
import type { PageProps } from '@/lib/contentful/api/props/page';
import type { CategoryProps } from '@/lib/contentful/api/props/category';
import type { CoffeeProps } from '@/lib/contentful/api/props/coffee';

// Revalidate sitemap every hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch all blogs by paginating (use small batches that work reliably)
    let allBlogs: BlogProps[] = [];
    let page = 1;
    const limit = 9; // Use same default limit as generateStaticParams
    let total = 0;

    // Keep fetching until we get all blogs
    while (true) {
      const blogsCollection = await getAllBlogs(page, limit);
      const blogs = blogsCollection.items as unknown as BlogProps[];
      total = blogsCollection.total;

      if (blogs.length === 0) break;

      allBlogs = [...allBlogs, ...blogs];

      // Stop if we've fetched all blogs
      if (allBlogs.length >= total) break;

      page++;
    }

    // Fetch all pages
    const pages = (await getAllPages()) as unknown as PageProps[];

    // Fetch all categories
    const categories = (await getAllCategories()) as unknown as CategoryProps[];

    // Fetch all coffees
    let allCoffees: CoffeeProps[] = [];
    let coffeePage = 1;
    const coffeeLimit = 100;
    let coffeeTotal = 0;

    // Keep fetching until we get all coffees
    while (true) {
      const coffeeCollection = await getAllCoffee(coffeePage, coffeeLimit);
      const coffees = coffeeCollection.items as unknown as CoffeeProps[];
      coffeeTotal = coffeeCollection.total;

      if (coffees.length === 0) break;

      allCoffees = [...allCoffees, ...coffees];

      // Stop if we've fetched all coffees
      if (allCoffees.length >= coffeeTotal) break;

      coffeePage++;
    }

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/coffee`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Blog post routes
    const blogRoutes: MetadataRoute.Sitemap = allBlogs.map((blog) => ({
    url: `${SITE_URL}/blog/${blog.slug}`,
    lastModified: new Date(blog.sys.firstPublishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Page routes
  const pageRoutes: MetadataRoute.Sitemap = (pages || []).map((page: { slug: string }) => ({
    url: `${SITE_URL}/page/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

    // Category routes
    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((category) => ({
      url: `${SITE_URL}/blog/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Coffee routes
    const coffeeRoutes: MetadataRoute.Sitemap = allCoffees.map((coffee) => ({
      url: `${SITE_URL}/coffee/${coffee.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...blogRoutes, ...pageRoutes, ...categoryRoutes, ...coffeeRoutes];
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error);
    // Return minimal sitemap on error
    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
    ];
  }
}