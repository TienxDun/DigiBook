import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAdminSelection } from './useAdminSelection';

describe('useAdminSelection', () => {
  it('toggles single items and keeps selection aligned to available ids', () => {
    const { result, rerender } = renderHook(
      ({ ids }) => useAdminSelection(ids),
      { initialProps: { ids: ['a', 'b', 'c'] } },
    );

    act(() => {
      result.current.toggleSelect('a');
      result.current.toggleSelect('b');
    });

    expect(result.current.selectedIds).toEqual(['a', 'b']);

    act(() => {
      result.current.toggleSelectAll();
    });
    expect(result.current.selectedIds).toEqual(['a', 'b', 'c']);

    rerender({ ids: ['a', 'c'] });
    expect(result.current.selectedIds).toEqual(['a', 'c']);
  });
});
