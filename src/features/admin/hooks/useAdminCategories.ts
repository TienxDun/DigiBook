import { useAdminCollection } from './useAdminCollection';
import { adminService } from '../services/admin.service';
import { CategoryInfo } from '../types';

export const useAdminCategories = (enabled: boolean) => {
  const collection = useAdminCollection<CategoryInfo>(adminService.getCategories, enabled);

  return {
    ...collection,
    categories: collection.data,
  };
};
