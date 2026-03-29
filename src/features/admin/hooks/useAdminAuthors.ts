import { useAdminCollection } from './useAdminCollection';
import { adminService } from '../services/admin.service';
import { Author } from '../types';

export const useAdminAuthors = (enabled: boolean) => {
  const collection = useAdminCollection<Author>(adminService.getAuthors, enabled);

  return {
    ...collection,
    authors: collection.data,
  };
};
