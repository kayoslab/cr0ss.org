import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revalidateDashboard } from './revalidate';

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  CACHE_TAGS: {
    DASHBOARD: 'dashboard',
  },
  PATHS: {
    DASHBOARD: '/dashboard',
  },
}));

import { revalidateTag, revalidatePath } from 'next/cache';

describe('revalidateDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should call revalidateTag with dashboard tag', () => {
    revalidateDashboard();

    expect(revalidateTag).toHaveBeenCalledWith('dashboard', 'max');
  });

  it('should call revalidatePath with dashboard path and page type', () => {
    revalidateDashboard();

    expect(revalidatePath).toHaveBeenCalledWith('/dashboard', 'page');
  });

  it('should call both revalidateTag and revalidatePath', () => {
    revalidateDashboard();

    expect(revalidateTag).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it('should use constants for tag and path values', () => {
    revalidateDashboard();

    // Verify it's using the constant values
    expect(revalidateTag).toHaveBeenCalledWith('dashboard', 'max');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard', 'page');
  });
});
