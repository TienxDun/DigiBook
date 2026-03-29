import { useAdminCollection } from './useAdminCollection';
import { adminService } from '../services/admin.service';
import { UserProfile } from '../types';

export const useAdminUsers = (enabled: boolean) => {
  const collection = useAdminCollection<UserProfile>(adminService.getUsers, enabled);

  return {
    ...collection,
    users: collection.data,
  };
};
