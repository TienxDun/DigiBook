import { useEffect, useState } from 'react';

export const useAdminSelection = (availableIds: string[]) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds((previous) => previous.filter((id) => availableIds.includes(id)));
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
