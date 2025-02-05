import { NextResponse } from 'next/server';
import { aa } from '@/lib/algolia/client';

export async function POST(request: Request) {
  try {
    const { objectID } = await request.json();
    
    if (!objectID) {
      return NextResponse.json({ error: 'objectID is required' }, { status: 400 });
    }

    aa('clickedObjectIDs', {
      eventName: 'Post Viewed',
      index: 'www',
      objectIDs: [objectID]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
} 