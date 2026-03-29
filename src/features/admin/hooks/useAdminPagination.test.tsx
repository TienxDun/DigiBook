import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAdminPagination } from './useAdminPagination';

describe('useAdminPagination', () => {
  it('paginates items and resets when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ items, search }) => useAdminPagination(items, 2, [search]),
      {
        initialProps: { items: [1, 2, 3, 4], search: '' },
      },
    );

    expect(result.current.paginatedItems).toEqual([1, 2]);

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.paginatedItems).toEqual([3, 4]);

    rerender({ items: [1, 2, 3], search: 'new-query' });
    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginatedItems).toEqual([1, 2]);
  });
});
