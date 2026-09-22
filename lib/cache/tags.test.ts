import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tags, invalidations, allBaseTags } from './tags';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

import { revalidateTag } from 'next/cache';
import * as revalidators from './revalidate';

describe('cache tag registry', () => {
  it('produces the general form when a parametric tag is called without arguments', () => {
    expect(tags.coffee.summary()).toBe('coffee:summary');
    expect(tags.coffee.summary('2025-12-05')).toBe('coffee:summary:2025-12-05');
    expect(tags.workouts.heatmap(60, 'running')).toBe(
      'workouts:heatmap:60:running'
    );
    expect(tags.habits.trends('writing_minutes,focus_minutes', 14)).toBe(
      'habits:trends:writing_minutes,focus_minutes:14'
    );
  });

  it('every invalidation set only contains registered tags', () => {
    const registered = allBaseTags();
    for (const [event, list] of Object.entries(invalidations)) {
      for (const tag of list) {
        expect(
          registered.has(tag),
          `${event} invalidates unregistered tag '${tag}'`
        ).toBe(true);
      }
    }
  });

  it('has no duplicate tag strings across groups', () => {
    const seen = new Map<string, number>();
    for (const tag of allBaseTags()) seen.set(tag, (seen.get(tag) ?? 0) + 1);
    // `content.entry()` yields '' for no-arg and is excluded by allBaseTags.
    expect([...seen.values()].every((n) => n === 1)).toBe(true);
  });
});

describe('revalidators', () => {
  beforeEach(() => vi.clearAllMocks());

  it('only ever revalidate registered tags, in the supported two-argument form', () => {
    const registered = allBaseTags();
    for (const fn of Object.values(revalidators)) fn();
    const calls = vi.mocked(revalidateTag).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    for (const [tag, profile] of calls) {
      expect(registered.has(tag), `revalidated unregistered tag '${tag}'`).toBe(
        true
      );
      expect(profile).toBe('max');
    }
  });

  it('revalidateDashboard covers every event', () => {
    revalidators.revalidateDashboard();
    const revalidated = new Set(
      vi.mocked(revalidateTag).mock.calls.map(([t]) => t)
    );
    for (const list of Object.values(invalidations)) {
      for (const tag of list) expect(revalidated.has(tag)).toBe(true);
    }
  });
});
