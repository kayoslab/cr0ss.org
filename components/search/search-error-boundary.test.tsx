import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SearchErrorBoundary } from './search-error-boundary';

// Component that throws an error
function ThrowError(): never {
  throw new Error('Test error');
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>;
}

describe('SearchErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const { getByText } = render(
      <SearchErrorBoundary>
        <NormalComponent />
      </SearchErrorBoundary>
    );

    expect(getByText('Normal content')).toBeInTheDocument();
  });

  it('should render error message when child throws error', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, queryByText } = render(
      <SearchErrorBoundary>
        <ThrowError />
      </SearchErrorBoundary>
    );

    expect(getByText('Search is temporarily unavailable')).toBeInTheDocument();
    expect(queryByText('Normal content')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should have correct error message styling', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <SearchErrorBoundary>
        <ThrowError />
      </SearchErrorBoundary>
    );

    const errorDiv = container.querySelector('div');
    expect(errorDiv).toHaveClass('text-sm');
    expect(errorDiv).toHaveClass('text-red-500');
    expect(errorDiv).toHaveClass('dark:text-red-400');

    consoleErrorSpy.mockRestore();
  });

  it('should catch errors from nested children', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = render(
      <SearchErrorBoundary>
        <div>
          <div>
            <ThrowError />
          </div>
        </div>
      </SearchErrorBoundary>
    );

    expect(getByText('Search is temporarily unavailable')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should maintain error state after re-render', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, rerender } = render(
      <SearchErrorBoundary>
        <ThrowError />
      </SearchErrorBoundary>
    );

    expect(getByText('Search is temporarily unavailable')).toBeInTheDocument();

    // Re-render with same error component
    rerender(
      <SearchErrorBoundary>
        <ThrowError />
      </SearchErrorBoundary>
    );

    expect(getByText('Search is temporarily unavailable')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
