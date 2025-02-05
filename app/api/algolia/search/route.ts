import { NextResponse } from 'next/server';
import type { SearchResponse } from '@algolia/client-search';
import { searchClient, aa, type AlgoliaHit } from '@/lib/algolia/search/client';
import { RateLimit } from '@/lib/utils/rate-limit';

const limiter = new RateLimit(60 * 1000, 10); // 10 requests per minute

export async function GET(request: Request) {
  if (!limiter.check()) {
    return NextResponse.json(
      { error: 'Too many requests' }, 
      { status: 429 }
    );
  }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const objectID = searchParams.get('objectID');

  if (objectID) {
    aa('clickedObjectIDs', {
      eventName: 'Post Clicked',
      index: 'www',
      objectIDs: [objectID],
    });
    return NextResponse.json({ success: true });
  }

  try {
    const { results } = await searchClient.search<AlgoliaHit>([{
      indexName: 'www',
      params: {
        query,
        hitsPerPage: 5,
        clickAnalytics: true
      }
    }]);

    const searchResponse = results[0] as SearchResponse<AlgoliaHit>;
    return NextResponse.json({
      hits: searchResponse.hits,
      queryID: searchResponse.queryID
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ hits: [], queryID: null }, { status: 500 });
  }
} 