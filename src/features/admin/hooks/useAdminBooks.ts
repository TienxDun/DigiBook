import { useCallback } from 'react';
import { adminService } from '../services/admin.service';
import { Book } from '../types';
import { useAdminCollection } from './useAdminCollection';

export const useAdminBooks = (enabled: boolean) => {
  const collection = useAdminCollection<Book>(adminService.getBooks, enabled);

  const updateStock = useCallback(
    async (bookId: string, stockQuantity: number) => {
      await adminService.updateBook(bookId, { stockQuantity });
      await collection.refresh();
    },
    [collection],
  );

  return {
    ...collection,
    books: collection.data,
    updateStock,
  };
};
