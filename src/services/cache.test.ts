import { afterEach, describe, expect, it, vi } from 'vitest';
import { cache } from './cache';

describe('cache.swr', () => {
  afterEach(() => {
    cache.clear();
    localStorage.clear();
  });

  it('returns cached or stale data for non-force requests', async () => {
    cache.set('admin:test:stale', [{ id: 'old' }], { ttl: 1, tags: ['admin-test'] });
    await new Promise((resolve) => setTimeout(resolve, 5));

    const fetcher = vi.fn().mockResolvedValue([{ id: 'fresh' }]);

    const result = await cache.swr('admin:test:stale', fetcher, { tags: ['admin-test'] });

    expect(result.data).toEqual([{ id: 'old' }]);
    expect(result.fromCache).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache and returns fresh data when force is enabled', async () => {
    cache.set('admin:test:force', [{ id: 'old' }], { tags: ['admin-test'], persist: true });

    const fetcher = vi.fn().mockResolvedValue([{ id: 'fresh' }]);

    const result = await cache.swr('admin:test:force', fetcher, {
      tags: ['admin-test'],
      persist: true,
      force: true,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([{ id: 'fresh' }]);
    expect(result.fromCache).toBe(false);
  });

  it('does not reuse cleared persisted data during a forced refresh', async () => {
    cache.set('admin:test:cleared', [{ id: 'stale' }], {
      tags: ['admin-test'],
      persist: true,
    });
    cache.clear('admin-test');

    const fetcher = vi.fn().mockResolvedValue([{ id: 'fresh' }]);

    const result = await cache.swr('admin:test:cleared', fetcher, {
      tags: ['admin-test'],
      persist: true,
      force: true,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([{ id: 'fresh' }]);
    expect(result.fromCache).toBe(false);
  });
});
