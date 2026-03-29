import { useAdminCollection } from './useAdminCollection';
import { adminService } from '../services/admin.service';
import { Order } from '../types';

export const useAdminOrders = (enabled: boolean) => {
  const collection = useAdminCollection<Order>(adminService.getOrders, enabled);

  return {
    ...collection,
    orders: collection.data,
  };
};
