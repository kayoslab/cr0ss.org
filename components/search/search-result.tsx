'use client';
import Image from 'next/image';
import { AlgoliaHit } from '@/lib/algolia/client';
import { optimizeWithPreset } from '@/lib/contentful/image-utils';
import { Badge } from '@/components/ui';

interface Props {
  hit: AlgoliaHit;
  onClick: (hit: AlgoliaHit) => void;
  isSelected: boolean;
}

export function SearchResult({ hit, onClick, isSelected }: Props) {
  const thumbnailUrl = hit.image ? optimizeWithPreset(hit.image, 'searchThumbnail') : null;

  return (
    <button
      onClick={() => onClick(hit)}
      className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors
        ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
        border-b border-gray-100 last:border-b-0`}
    >
      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="shrink-0 overflow-hidden rounded">
          <Image
            src={thumbnailUrl}
            alt={hit.title ? `${hit.title} thumbnail` : 'Blog post thumbnail'}
            width={48}
            height={36}
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
          {hit.title}
        </div>
        {hit.summary && (
          <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">
            {hit.summary}
          </div>
        )}
        {hit.categories && hit.categories.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {hit.categories.slice(0, 2).map(category => (
              <Badge
                key={category}
                variant={isSelected ? 'primary' : 'default'}
                size="sm"
                className="text-[10px]"
              >
                {category}
              </Badge>
            ))}
            {hit.categories.length > 2 && (
              <span className="text-[10px] text-gray-400">
                +{hit.categories.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className={`shrink-0 self-center ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
} 