import { useEffect, useState } from 'react';

export const useAdminSelection = (availableIds: string[]) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds((previous) => {
      const nextSelection = previous.filter((id) => availableIds.includes(id));
      const isUnchanged =
        nextSelection.length === previous.length &&
        nextSelection.every((id, index) => id === previous[index]);

      return isUnchanged ? previous : nextSelection;
    });
  }, [availableIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((previous) => (
      previous.includes(id)
        ? previous.filter((currentId) => currentId !== id)
        : [...previous, id]
    ));
  };

  const toggleSelectAll = () => {
    setSelectedIds((previous) => (
      previous.length === availableIds.length ? [] : [...availableIds]
    ));
  };

  const clearSelection = () => setSelectedIds([]);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
};
