import { NextResponse } from 'next/server';
import { env } from '@/env';
import { getBlog } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { CategoryProps } from '@/lib/contentful/api/props/category';
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { algoliasearch } from "algoliasearch";

function getErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message
	return String(error)
}

export async function POST(request: Request) {
    const requestHeaders = new Headers(request.headers);
    const secret = requestHeaders.get('x-vercel-index-key');
  
    if (secret !== env.CONTENTFUL_INDEX_SECRET) {
      return NextResponse.json(
        { 
            message: 'Invalid secret' 
        }, { 
            status: 401 
        }
    );
    }
  
    const body = await request.json();
    const slug = body.slug;
    if (!slug) {
        return NextResponse.json(
            {
                message: 'No slug provided' 
            }, { 
                status: 400 
            }
        );
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
        return NextResponse.json(
            { 
                message: 'Could not update index with error: ' + getErrorMessage(err)
            }, { 
                status: 400 
            }
        );
    }

    return NextResponse.json({ revalidated: true, now: Date.now() }, {status: 200 });
  }