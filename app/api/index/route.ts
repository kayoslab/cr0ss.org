import { NextResponse } from 'next/server';
import { env } from '@/env';
import { getAllBlogs, getBlog } from '@/lib/contentful/api/blog';
import { BlogProps } from '@/lib/contentful/api/props/blog';
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
const algoliasearch = require('algoliasearch');

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
  
    // const body = await request.json();
    // const slug = body.fields.slug;
    // if (!slug) {
    //     return NextResponse.json(
    //         {
    //             message: 'No slug provided' 
    //         }, { 
    //             status: 400 
    //         }
    //     );
    // }

    const algoliaClient = algoliasearch(
        env.ALGOLIA_APP_ID,
        env.ALGOLIA_ADMIN_KEY
    );
    const algoliaIndex = algoliaClient.initIndex(env.ALGOLIA_INDEX);
    

    try {
        // const post = await getBlog(slug);
        // algoliaIndex.addObjects(
        //     {
        //         url: `/blog/${post.slug}/`,
        //         title: post.title,
        //         summary: post.summary,
        //         details: documentToPlainTextString(post.details.json),
        //         image: post.heroImage?.url,
        //         objectID: post.sys.id
        //     }
        // )

        const { items } = await getAllBlogs(1000);
        // map and manipulate the data you’re interested in indexing in Algolia
        const posts = items.map(
            (post: BlogProps) => ({
                url: `/blog/${post.slug}/`,
                title: post.title,
                summary: post.summary,
                details: documentToPlainTextString(post.details.json),
                image: post.heroImage?.url,
                objectID: post.sys.id
            })
        );
        await algoliaIndex.addObjects(posts);
    } catch(err) {
        return NextResponse.json(
            { 
                message: 'Could not update index with error: ' + getErrorMessage(err)
            }, { 
                status: 400 
            }
        );
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  }