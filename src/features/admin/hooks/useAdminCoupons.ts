import { useAdminCollection } from './useAdminCollection';
import { adminService } from '../services/admin.service';
import { Coupon } from '../types';

export const useAdminCoupons = (enabled: boolean) => {
  const collection = useAdminCollection<Coupon>(adminService.getCoupons, enabled);

  return {
    ...collection,
    coupons: collection.data,
  };
};
