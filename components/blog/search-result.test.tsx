import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SearchResult } from './search-result';
import type { AlgoliaHit } from '@/lib/algolia/client';

describe('Blog SearchResult', () => {
  const mockHit: AlgoliaHit = {
    objectID: '1',
    title: 'Test Blog Post',
    summary: 'This is a blog post summary',
    categories: ['tech', 'blog'],
    url: '/blog/test-post',
  };

  const mockOnClick = vi.fn();

  it('should render the blog post title', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('Test Blog Post')).toBeInTheDocument();
  });

  it('should render the summary when provided', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('This is a blog post summary')).toBeInTheDocument();
  });

  it('should not render summary when missing', () => {
    const hitWithoutSummary = { ...mockHit, summary: undefined };

    const { queryByText } = render(
      <SearchResult hit={hitWithoutSummary} onClick={mockOnClick} isSelected={false} />
    );

    expect(queryByText('This is a blog post summary')).not.toBeInTheDocument();
  });

  it('should render categories when provided', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('tech')).toBeInTheDocument();
    expect(getByText('blog')).toBeInTheDocument();
  });

  it('should not render categories when array is empty', () => {
    const hitWithoutCategories = { ...mockHit, categories: [] };

    const { container } = render(
      <SearchResult hit={hitWithoutCategories} onClick={mockOnClick} isSelected={false} />
    );

    const categorySpans = container.querySelectorAll('.text-xs.bg-gray-200');
    expect(categorySpans).toHaveLength(0);
  });

  it('should handle undefined categories', () => {
    const hitWithUndefinedCategories: AlgoliaHit = {
      ...mockHit,
      categories: undefined as unknown as string[]
    };

    const { container } = render(
      <SearchResult hit={hitWithUndefinedCategories} onClick={mockOnClick} isSelected={false} />
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

  it('should have correct text styling', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    const title = getByText('Test Blog Post');
    expect(title).toHaveClass('font-medium');

    const summary = getByText('This is a blog post summary');
    expect(summary).toHaveClass('text-xs');
    expect(summary).toHaveClass('text-gray-500');
  });

  it('should truncate summary text', () => {
    const { getByText } = render(
      <SearchResult hit={mockHit} onClick={mockOnClick} isSelected={false} />
    );

    const summary = getByText('This is a blog post summary');
    expect(summary).toHaveClass('truncate');
  });

  it('should render with only required fields', () => {
    const minimalHit: AlgoliaHit = {
      objectID: '2',
      title: 'Minimal Blog Post',
      categories: [],
      url: '/blog/minimal',
    };

    const { getByText } = render(
      <SearchResult hit={minimalHit} onClick={mockOnClick} isSelected={false} />
    );

    expect(getByText('Minimal Blog Post')).toBeInTheDocument();
  });
});
