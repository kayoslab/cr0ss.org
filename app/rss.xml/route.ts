import { NextResponse } from 'next/server';
import { getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
var RSS = require('rss');

export async function GET() {
    const ITEMS_PER_PAGE = 10;
    let allPosts: BlogProps[] = [];
    let currentPage = 1;
    
    // First fetch to get total number of posts
    const initialCollection = await getAllBlogs(1, ITEMS_PER_PAGE);
    const totalPosts = initialCollection.total;
    const totalPages = Math.ceil(totalPosts / ITEMS_PER_PAGE);
    
    // Add first page results
    allPosts = [...initialCollection.items];
    
    // Fetch remaining pages
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    await Promise.all(
        remainingPages.map(async (page) => {
            const collection = await getAllBlogs(page, ITEMS_PER_PAGE);
            allPosts = [...allPosts, ...collection.items];
        })
    );

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

    allPosts.map((post: BlogProps) => {
        const feedItem = {
            title: post.title,
            description: post.summary,
            url: `${site_url}/blog/${post.slug}`,
            date: post.sys.createdAt,
        };
        feed.item(feedItem);
    });
    
    return new NextResponse(feed.xml({ indent: true }), {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        },
    });
} 