import { useState, useCallback } from 'react';
import type { AlgoliaHit } from '@/lib/algolia/client';

export function useKeyboardNavigation(suggestions: AlgoliaHit[], onSelect: (hit: AlgoliaHit) => void) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => i < suggestions.length - 1 ? i + 1 : i);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => i > -1 ? i - 1 : i);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          onSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        break;
    }
  }, [suggestions, selectedIndex, onSelect]);

  return { selectedIndex, handleKeyDown };
} 