import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { BlogViewTracker } from './blog-view-tracker';
import type { BlogProps } from '@/lib/contentful/api/props/blog';

describe('BlogViewTracker', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockBlog = {
    sys: {
      id: 'test-blog-123',
    },
    title: 'Test Blog',
  } as unknown as BlogProps;

  it('should render nothing (null)', () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { container } = render(<BlogViewTracker blog={mockBlog} />);

    expect(container.firstChild).toBeNull();
  });

  it('should track blog view on mount', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    render(<BlogViewTracker blog={mockBlog} />);

    // Wait for effect to run
    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledWith('/api/algolia/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectID: 'test-blog-123',
      }),
    });
  });

  it('should retry on failed response', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });

    render(<BlogViewTracker blog={mockBlog} />);

    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should retry on network error', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<BlogViewTracker blog={mockBlog} />);

    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error tracking view:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should retry up to MAX_RETRIES times', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<BlogViewTracker blog={mockBlog} />);

    await vi.runAllTimersAsync();

    // Initial attempt + 3 retries = 4 total
    expect(mockFetch).toHaveBeenCalledTimes(4);

    consoleErrorSpy.mockRestore();
  });

  it('should use correct retry delay', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });

    render(<BlogViewTracker blog={mockBlog} />);

    // First call happens immediately
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance time by retry delay (1000ms)
    await vi.advanceTimersByTimeAsync(1000);

    // Second call should have happened
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should track view with different blog IDs', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const blog1 = { ...mockBlog, sys: { id: 'blog-1' } } as unknown as BlogProps;
    const blog2 = { ...mockBlog, sys: { id: 'blog-2' } } as unknown as BlogProps;

    const { rerender } = render(<BlogViewTracker blog={blog1} />);
    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/algolia/analytics',
      expect.objectContaining({
        body: JSON.stringify({ objectID: 'blog-1' }),
      })
    );

    mockFetch.mockClear();

    rerender(<BlogViewTracker blog={blog2} />);
    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/algolia/analytics',
      expect.objectContaining({
        body: JSON.stringify({ objectID: 'blog-2' }),
      })
    );
  });
});
