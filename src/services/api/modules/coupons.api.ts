import { apiClient, handleApiError } from '../client';
import { ApiResponse } from '../types';
import { Coupon } from '@/shared/types';
import { cache } from '../../cache';

const COUPONS_TAG = 'coupons';
const TTL_5M = 5 * 60 * 1000;

interface FetchCouponsOptions {
  force?: boolean;
}

interface ValidateCouponRequest {
  code: string;
  orderTotal: number;
}

interface ValidateCouponResponse {
  coupon: Coupon;
  discount: number;
  finalTotal: number;
}

export const couponsApi = {
  /**
   * Get all coupons (admin)
   */
  async getAll(options?: FetchCouponsOptions): Promise<Coupon[]> {
    try {
      if (options?.force) {
        const response = await apiClient.get<ApiResponse<Coupon[]>>('/api/coupons', {
          params: {
            force: true,
            _ts: Date.now(),
          },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });

        return response.data.data || [];
      }

      const { data } = await cache.swr<Coupon[]>(
        `${COUPONS_TAG}:all`,
        async () => {
          const response = await apiClient.get<ApiResponse<Coupon[]>>('/api/coupons');
          return response.data.data || [];
        },
        { ttl: TTL_5M, persist: true, tags: [COUPONS_TAG] }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching coupons:', handleApiError(error));
      return [];
    }
  },

  /**
   * Get coupon by ID
   */
  async getById(couponId: string): Promise<Coupon | null> {
    try {
      const { data } = await cache.swr<Coupon | null>(
        `${COUPONS_TAG}:${couponId}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Coupon>>(`/api/coupons/${couponId}`);
          return response.data.data || null;
        },
        { persist: true }
      );
      return data || null;
    } catch (error) {
      console.error('Error fetching coupon:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get coupon by code
   */
  async getByCode(code: string): Promise<Coupon | null> {
    try {
      const { data } = await cache.swr<Coupon | null>(
        `${COUPONS_TAG}:code:${code}`,
        async () => {
          const response = await apiClient.get<ApiResponse<Coupon>>(`/api/coupons/code/${code}`);
          return response.data.data || null;
        },
        { persist: true }
      );
      return data || null;
    } catch (error) {
      console.error('Error fetching coupon by code:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get active coupons
   */
  async getActive(): Promise<Coupon[]> {
    try {
      const { data } = await cache.swr<Coupon[]>(
        `${COUPONS_TAG}:active`,
        async () => {
          const response = await apiClient.get<ApiResponse<Coupon[]>>('/api/coupons/active');
          return response.data.data || [];
        },
        { persist: true }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching active coupons:', handleApiError(error));
      return [];
    }
  },

  /**
   * Validate coupon and calculate discount
   */
  async validate(code: string, orderTotal: number): Promise<ValidateCouponResponse | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<ValidateCouponResponse>>('/api/coupons/validate', {
        code,
        orderTotal
      });
      return data.data || null;
    } catch (error) {
      const errorMsg = handleApiError(error);
      // Re-throw with user-friendly message for UI
      throw new Error(errorMsg);
    }
  },

  /**
   * Create new coupon (admin)
   */
  async create(coupon: Omit<Coupon, 'id'>): Promise<string | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<Coupon>>('/api/coupons', coupon);
      cache.clear(COUPONS_TAG);
      return data.data?.id || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Update coupon (admin)
   */
  async update(couponId: string, updates: Partial<Coupon>): Promise<void> {
    try {
      await apiClient.put(`/api/coupons/${couponId}`, updates);
      cache.clear(COUPONS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Delete coupon (admin)
   */
  async delete(couponId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/coupons/${couponId}`);
      cache.clear(COUPONS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Increment coupon usage count
   */
  async incrementUsage(couponId: string): Promise<void> {
    try {
      await apiClient.post(`/api/coupons/${couponId}/increment-usage`);
      cache.clear(COUPONS_TAG);
    } catch (error) {
      console.error('Error incrementing coupon usage:', handleApiError(error));
    }
  },

  /**
   * Toggle coupon active status (admin)
   */
  async toggleActive(couponId: string): Promise<void> {
    try {
      await apiClient.post(`/api/coupons/${couponId}/toggle-active`);
      cache.clear(COUPONS_TAG);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
