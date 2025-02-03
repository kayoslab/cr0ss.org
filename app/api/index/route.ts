import { NextResponse } from 'next/server';
import { env } from '@/env';
import { getBlog, getAllBlogs } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { CategoryProps } from '@/lib/contentful/api/props/category';
// import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { algoliasearch } from "algoliasearch";

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
        ]);

        return NextResponse.json(
            { 
                revalidated: true, 
                now: Date.now() 
            }, { 
                status: 200
            }
        );
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