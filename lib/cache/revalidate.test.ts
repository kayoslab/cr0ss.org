import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  revalidateDashboard,
  revalidateCoffee,
  revalidateGoals,
} from './revalidate';
import { invalidations } from './tags';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

import { revalidateTag, revalidatePath } from 'next/cache';

describe('revalidateDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revalidates the overview tag', () => {
    revalidateDashboard();
    expect(revalidateTag).toHaveBeenCalledWith('dashboard', 'max');
  });

  it('revalidates the dashboard page once', () => {
    revalidateDashboard();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard', 'page');
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it('revalidates each distinct tag exactly once', () => {
    revalidateDashboard();
    const distinct = new Set(Object.values(invalidations).flat());
    expect(revalidateTag).toHaveBeenCalledTimes(distinct.size);
  });
});

describe('event-specific revalidators', () => {
  beforeEach(() => vi.clearAllMocks());

  it('revalidateCoffee invalidates the coffee set and the overview', () => {
    revalidateCoffee();
    for (const tag of invalidations.coffee) {
      expect(revalidateTag).toHaveBeenCalledWith(tag, 'max');
    }
    expect(revalidateTag).toHaveBeenCalledWith('dashboard', 'max');
  });

  it('revalidateGoals reaches the derived habits and running data', () => {
    revalidateGoals();
    expect(revalidateTag).toHaveBeenCalledWith('habits:consistency', 'max');
    expect(revalidateTag).toHaveBeenCalledWith('workouts:running', 'max');
  });
});
