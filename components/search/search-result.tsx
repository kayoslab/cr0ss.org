'use client';
import { AlgoliaHit } from '@/lib/algolia/client';

interface Props {
  hit: AlgoliaHit;
  onClick: (hit: AlgoliaHit) => void;
  isSelected: boolean;
}

export function SearchResult({ hit, onClick, isSelected }: Props) {
  return (
    <button
      onClick={() => onClick(hit)}
      className={`block w-full text-left px-4 py-2 text-sm 
        ${isSelected ? 'bg-gray-100 dark:bg-slate-600' : 'hover:bg-gray-100 dark:hover:bg-slate-600'}
        text-gray-700 dark:text-white`}
    >
      <div className="font-medium">{hit.title}</div>
      {hit.summary && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          {hit.summary}
        </div>
      )}
      {hit.categories && hit.categories.length > 0 && (
        <div className="flex gap-1 mt-1">
          {hit.categories.map(category => (
            <span key={category} className="text-xs bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-sm">
              {category}
            </span>
          ))}
        </div>
      )}
    </button>
  );
} 