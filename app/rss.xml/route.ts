import { NextResponse } from 'next/server';
import { cacheLife, cacheTag } from 'next/cache';
import RSS from 'rss';
import { getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { tags } from '@/lib/cache/tags';

const SITE_URL = 'https://cr0ss.org';
const ITEMS_PER_PAGE = 10;

/** The feed XML, cached with the blog content and invalidated by the webhook. */
async function buildFeed(): Promise<string> {
  'use cache';
  cacheLife('content');
  cacheTag(tags.content.blogPosts);

  const first = await getAllBlogs(1, ITEMS_PER_PAGE);
  const totalPages = Math.ceil(first.total / ITEMS_PER_PAGE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
      getAllBlogs(i + 2, ITEMS_PER_PAGE)
    )
  );
  const posts = [first, ...rest].flatMap(
    (c) => c.items as unknown as BlogProps[]
  );

  const feed = new RSS({
    title: 'cr0ss.org',
    description: 'Personal and professional website on cr0ss.org!',
    site_url: SITE_URL,
    feed_url: `${SITE_URL}/rss.xml`,
    pubDate: new Date(),
    copyright: `All rights reserved ${new Date().getFullYear()}`,
  });
  for (const post of posts) {
    feed.item({
      title: post.title,
      description: post.summary,
      url: `${SITE_URL}/blog/${post.slug}`,
      date: post.sys.firstPublishedAt,
    });
  }
  return feed.xml({ indent: true });
}

export async function GET() {
  return new NextResponse(await buildFeed(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
