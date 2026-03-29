import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAdminSelection } from './useAdminSelection';

describe('useAdminSelection', () => {
  it('keeps stable state when available IDs change by reference only', () => {
    const { result, rerender } = renderHook(
      ({ availableIds }) => useAdminSelection(availableIds),
      {
        initialProps: {
          availableIds: ['a', 'b', 'c'],
        },
      },
    );

    act(() => {
      result.current.toggleSelect('a');
      result.current.toggleSelect('b');
    });

    const previousSelection = result.current.selectedIds;

    rerender({
      availableIds: ['a', 'b', 'c'],
    });

    expect(result.current.selectedIds).toBe(previousSelection);
    expect(result.current.selectedIds).toEqual(['a', 'b']);
  });
});
