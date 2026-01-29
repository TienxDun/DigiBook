import { apiClient, handleApiError } from '../client';
import { ApiResponse, PricingRequest, PricingResponse, DiscountRequest, DiscountResponse } from '../types';

export const pricingApi = {
  // STRATEGY PATTERN: Calculate price with strategy
  async calculate(request: PricingRequest): Promise<PricingResponse | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<PricingResponse>>('/api/pricing/calculate', request);
      return data.data || null;
    } catch (error) {
      console.error('Error calculating price:', handleApiError(error));
      return null;
    }
  },

  // Calculate price for specific user (auto-select strategy from membershipTier)
  async calculateForUser(userId: string, basePrice: number, quantity: number): Promise<PricingResponse | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<PricingResponse>>(
        `/api/pricing/calculate-for-user/${userId}`,
        { basePrice, quantity }
      );
      return data.data || null;
    } catch (error) {
      console.error('Error calculating price for user:', handleApiError(error));
      return null;
    }
  },

  // Get membership info
  async getMembershipInfo(userId: string): Promise<any> {
    try {
      const { data } = await apiClient.get<ApiResponse<any>>(`/api/pricing/membership/${userId}`);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching membership info:', handleApiError(error));
      return null;
    }
  }
};

export const discountApi = {
  // DECORATOR PATTERN: Calculate stacked discounts
  async calculate(request: DiscountRequest): Promise<DiscountResponse | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<DiscountResponse>>('/api/discount/calculate', request);
      return data.data || null;
    } catch (error) {
      console.error('Error calculating discount:', handleApiError(error));
      return null;
    }
  },

  // Quick discount (percentage only)
  async quickDiscount(price: number, percentage: number): Promise<any> {
    try {
      const { data } = await apiClient.get<ApiResponse<any>>('/api/discount/quick', {
        params: { price, percentage }
      });
      return data.data || null;
    } catch (error) {
      console.error('Error calculating quick discount:', handleApiError(error));
      return null;
    }
  }
};