import type { MetadataRoute } from 'next';
import { getAllBlogs } from '@/lib/contentful/api/blog';
import { getAllPages } from '@/lib/contentful/api/page';
import { SITE_URL } from '@/lib/constants';
import type { BlogProps } from '@/lib/contentful/api/props/blog';
import type { PageProps } from '@/lib/contentful/api/props/page';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all blog posts
  const blogsCollection = await getAllBlogs(1, 1000); // Get up to 1000 posts
  const blogs = blogsCollection.items as unknown as BlogProps[];

  // Fetch all pages
  const pages = (await getAllPages()) as unknown as PageProps[];

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
  ];

  // Blog post routes
  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
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

  return [...staticRoutes, ...blogRoutes, ...pageRoutes];
}