import { NextResponse } from 'next/server';
import { env } from '@/env';
import { getBlog, getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { CategoryProps } from '@/lib/contentful/api/props/category';
// import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { algoliasearch } from "algoliasearch";
import fs from "fs";
var RSS = require('rss');

function getErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message
	return String(error)
}

export async function POST(request: Request) {
    try {
        // Validate first and throw if invalid
        validateSecret(request);
        
        // Run operations in parallel
        await Promise.all([
            updateAlgoliaIndex(request),
            updateRSSFeed(request)
        ]);

        return NextResponse.json({ revalidated: true, now: Date.now() }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ 
            message: 'Error processing request: ' + getErrorMessage(error) 
        }, { 
            status: 500 
        });
    }
}

function validateSecret(request: Request) {
    const requestHeaders = new Headers(request.headers);
    const secret = requestHeaders.get('x-vercel-index-key');
  
    if (secret !== env.CONTENTFUL_INDEX_SECRET) {
        throw new Error('Invalid secret');
    }
}

async function updateAlgoliaIndex(request: Request) {
    const body = await request.json();
    const slug = body.slug;
    if (!slug) {
        throw new Error('No slug provided');
    }

    const algoliaClient = algoliasearch(
        env.ALGOLIA_APP_ID,
        env.ALGOLIA_ADMIN_KEY
    );    

    try {
        const post: BlogProps = await getBlog(slug);
        await algoliaClient.addOrUpdateObject(
            {
                indexName: env.ALGOLIA_INDEX,
                objectID: post.sys.id,
                body: {
                    url: `/blog/${post.slug}/`,
                    title: post.title,
                    summary: post.summary,
                    author: post.author,
                    categories: post.categoriesCollection.items.map((category: CategoryProps) => category.title).join(','),
                    image: post.heroImage?.url,
                    objectID: post.sys.id
                }
            }
        )


    } catch(err) {
        throw new Error('Could not update index: ' + getErrorMessage(err));
    }
}

async function updateRSSFeed(request: Request) {
    const allPosts = await getAllBlogs();
    const site_url = "https://cr0ss.org";

    const feedOptions = {
        title: "cr0ss.org",
        description: "Personal and professional website on cr0ss.org!",
        site_url: site_url,
        feed_url: `${site_url}/rss.xml`,
        // image_url: `${site_url}/logo.jpeg`,
        pubDate: new Date(),
        copyright: `All rights reserved ${new Date().getFullYear()}`,
    };

    const feed = new RSS(feedOptions);

    allPosts.map((post: BlogProps) => {
        feed.item({
            title: post.title,
            description: post.summary,
            url: `${site_url}/blog/${post.slug}`,
            date: post.sys.createdAt,
        });
    });

    // Write to the public directory instead of a relative path
    const publicDir = process.cwd() + '/public';
    if (!fs.existsSync(publicDir)){
        fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(`${publicDir}/rss.xml`, feed.xml({ indent: true }));
}