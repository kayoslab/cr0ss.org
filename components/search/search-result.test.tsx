import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SearchResult } from './search-result';
import type { AlgoliaHit } from '@/lib/algolia/client';

describe('SearchResult', () => {
  const mockHit: AlgoliaHit = {
    objectID: '1',
    title: 'Test Post',
    summary: 'This is a test summary',
    categories: ['tech', 'programming'],
    url: '/test-post',
  };

  const mockOnClick = vi.fn();

  it('should render the hit title', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('Test Post')).toBeInTheDocument();
  });

  it('should render the summary when provided', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('This is a test summary')).toBeInTheDocument();
  });

  it('should not render summary section when summary is missing', () => {
    const hitWithoutSummary = { ...mockHit, summary: undefined };

    const { queryByText } = render(
      <SearchResult hit={hitWithoutSummary} onClick={mockOnClick} isSelected={false} />
    );

    expect(queryByText('This is a test summary')).not.toBeInTheDocument();
  });

  it('should render categories when provided', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('tech')).toBeInTheDocument();
    expect(getByText('programming')).toBeInTheDocument();
  });

  it('should not render categories when empty', () => {
    const hitWithoutCategories = { ...mockHit, categories: [] };

    const { container } = render(
      <SearchResult hit={hitWithoutCategories} onClick={mockOnClick} isSelected={false} />
    );

    const categorySpans = container.querySelectorAll('.text-xs.bg-gray-200');
    expect(categorySpans).toHaveLength(0);
  });

  it('should call onClick with hit when clicked', () => {
    const { getByRole } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    const button = getByRole('button');
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledWith(mockHit);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should apply selected styling when isSelected is true', () => {
    const { getByRole } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={true} />
    );

    const button = getByRole('button');
    expect(button).toHaveClass('bg-gray-100');
  });

  it('should apply hover styling when isSelected is false', () => {
    const { getByRole } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    const button = getByRole('button');
    expect(button).toHaveClass('hover:bg-gray-100');
  });

  it('should render as a button element', () => {
    const { getByRole } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByRole('button')).toBeInTheDocument();
  });

  it('should render multiple categories correctly', () => {
    const hitWithManyCategories = {
      ...mockHit,
      categories: ['tech', 'programming', 'react', 'typescript'],
    };

    const { getByText } = render(
      <SearchResult hit={hitWithManyCategories} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('tech')).toBeInTheDocument();
    expect(getByText('programming')).toBeInTheDocument();
    expect(getByText('react')).toBeInTheDocument();
    expect(getByText('typescript')).toBeInTheDocument();
  });

  it('should have correct text alignment', () => {
    const { getByRole } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    const button = getByRole('button');
    expect(button).toHaveClass('text-left');
  });

  it('should render with minimal data (only title)', () => {
    const minimalHit: AlgoliaHit = {
      objectID: '2',
      title: 'Minimal Post',
      categories: [],
      url: '/minimal',
    };

    const { getByText, queryByText } = render(
      <SearchResult hit={minimalHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('Minimal Post')).toBeInTheDocument();
    expect(queryByText(/This is/)).not.toBeInTheDocument();
  });
});
