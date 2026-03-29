import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAdminCollection } from './useAdminCollection';

describe('useAdminCollection', () => {
  it('forces fresh loading on first load and on refresh', async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'initial' }])
      .mockResolvedValueOnce([{ id: 'fresh' }]);

    const { result } = renderHook(() => useAdminCollection(loader, true));

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'initial' }]);
    });

    expect(loader).toHaveBeenNthCalledWith(1, { force: true });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'fresh' }]);
    });

    expect(loader).toHaveBeenNthCalledWith(2, { force: true });
  });

  it('keeps the latest refresh result when requests resolve out of order', async () => {
    let resolveInitial!: (value: Array<{ id: string }>) => void;
    let resolveOlder!: (value: Array<{ id: string }>) => void;
    let resolveLatest!: (value: Array<{ id: string }>) => void;
    let callCount = 0;

    const loader = vi.fn(() => {
      callCount += 1;

      if (callCount === 1) {
        return new Promise<Array<{ id: string }>>((resolve) => {
          resolveInitial = resolve;
        });
      }

      if (callCount === 2) {
        return new Promise<Array<{ id: string }>>((resolve) => {
          resolveOlder = resolve;
        });
      }

      return new Promise<Array<{ id: string }>>((resolve) => {
        resolveLatest = resolve;
      });
    });

    const { result } = renderHook(() => useAdminCollection(loader, true));

    await act(async () => {
      resolveInitial([{ id: 'initial' }]);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'initial' }]);
    });

    let olderPromise!: Promise<Array<{ id: string }>>;
    let latestPromise!: Promise<Array<{ id: string }>>;

    await act(async () => {
      olderPromise = result.current.refresh();
      latestPromise = result.current.refresh();
    });

    await act(async () => {
      resolveLatest([{ id: 'latest' }]);
      await latestPromise;
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'latest' }]);
    });

    await act(async () => {
      resolveOlder([{ id: 'older' }]);
      await olderPromise;
    });

    expect(result.current.data).toEqual([{ id: 'latest' }]);
  });
});
