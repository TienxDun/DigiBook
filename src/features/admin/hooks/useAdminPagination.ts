import { DependencyList, useEffect, useMemo, useState } from 'react';

export const useAdminPagination = <T,>(items: T[], itemsPerPage: number, resetDeps: DependencyList = []) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, resetDeps);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [items, currentPage, itemsPerPage],
  );

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
  };
};
