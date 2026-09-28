import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/algolia/client', () => ({ aa: vi.fn() }));
vi.mock('@/lib/rate/limit', () => ({ rateLimit: vi.fn() }));
vi.mock('@/lib/rate/who', () => ({ getClientId: () => 'test-client' }));
vi.mock('@/env', () => ({
  env: { ALGOLIA_INDEX: 'www' },
}));

import { aa } from '@/lib/algolia/client';
import { rateLimit } from '@/lib/rate/limit';
import { POST } from './route';

const post = (body: unknown) =>
  POST(
    new Request('http://localhost:3000/api/algolia/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

describe('POST /api/algolia/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aa).mockImplementation(() => {});
    vi.mocked(rateLimit).mockResolvedValue({ ok: true });
  });

  describe('events', () => {
    it('defaults to a view event and passes the user token per event', async () => {
      const response = await post({
        objectID: 'blog-post-123',
        userToken: 'user_abc',
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(aa).toHaveBeenCalledTimes(1);
      expect(aa).toHaveBeenCalledWith('viewedObjectIDs', {
        eventName: 'Blog Viewed',
        index: 'www',
        objectIDs: ['blog-post-123'],
        userToken: 'user_abc',
      });
      expect(aa).not.toHaveBeenCalledWith('setUserToken', expect.anything());
    });

    it.each([
      ['click', 'Blog Clicked'],
      ['recommendation_click', 'Recommendation Clicked'],
    ])(
      'records %s as a clickedObjectIDs event',
      async (eventType, eventName) => {
        const response = await post({ objectID: 'blog-post-123', eventType });

        expect(response.status).toBe(200);
        expect(aa).toHaveBeenCalledWith('clickedObjectIDs', {
          eventName,
          index: 'www',
          objectIDs: ['blog-post-123'],
          userToken: undefined,
        });
      }
    );
  });

  describe('validation', () => {
    it.each([
      ['missing objectID', {}],
      ['null objectID', { objectID: null }],
      ['empty objectID', { objectID: '' }],
      ['numeric objectID', { objectID: 12345 }],
      ['unknown eventType', { objectID: 'x', eventType: 'purchase' }],
      ['oversized userToken', { objectID: 'x', userToken: 'a'.repeat(129) }],
    ])('rejects %s with 400', async (_label, body) => {
      const response = await post(body);

      expect(response.status).toBe(400);
      expect(aa).not.toHaveBeenCalled();
    });

    it('rejects malformed JSON with 400', async () => {
      const response = await post('{not json');

      expect(response.status).toBe(400);
      expect(aa).not.toHaveBeenCalled();
    });

    it('ignores extra fields', async () => {
      const response = await post({ objectID: 'x', extra: 'ignored' });

      expect(response.status).toBe(200);
    });
  });

  describe('protection', () => {
    it('returns 429 when the rate limit is exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({ ok: false, retryAfterSec: 30 });

      const response = await post({ objectID: 'x' });

      expect(response.status).toBe(429);
      expect(aa).not.toHaveBeenCalled();
    });

    it('returns 500 when the insights client throws', async () => {
      vi.mocked(aa).mockImplementation(() => {
        throw new Error('boom');
      });

      const response = await post({ objectID: 'x' });

      expect(response.status).toBe(500);
    });
  });
});
