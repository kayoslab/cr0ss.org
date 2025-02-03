import { NextResponse } from 'next/server';
import { getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
var RSS = require('rss');

export async function GET() {
    const blogCollection = await getAllBlogs(1, 100);
    const site_url = "https://cr0ss.org";

    const feedOptions = {
        title: "cr0ss.org",
        description: "Personal and professional website on cr0ss.org!",
        site_url: site_url,
        feed_url: `${site_url}/rss.xml`,
        pubDate: new Date(),
        copyright: `All rights reserved ${new Date().getFullYear()}`,
    };

    const feed = new RSS(feedOptions);

    blogCollection.items.map((post: BlogProps) => {
        feed.item({
            title: post.title,
            description: post.summary,
            url: `${site_url}/blog/${post.slug}`,
            date: post.sys.createdAt,
        });
    });

    return new NextResponse(feed.xml({ indent: true }), {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        },
    });
} 