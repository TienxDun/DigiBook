import { apiClient, handleApiError } from '../client';
import {
  ApiResponse,
  PricingRequest,
  PricingResponse,
  DiscountRequest,
  DiscountResponse,
  CheckoutCalculationRequest,
  CheckoutResponse,
  CouponApplyRequest,
  CouponApplyResponse,
  BlackFridayRequest,
  BlackFridayResponse
} from '../types';

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
  },

  // ===== PHASE 3: MARKETPLACE COMPARISON =====

  /**
   * Compare book prices across multiple marketplaces
   */
  async compareMarketplace(bookId: string): Promise<any> {
    try {
      const { data } = await apiClient.get<ApiResponse<any>>(`/api/pricing/marketplace-compare/${bookId}`);
      return data.data || null;
    } catch (error) {
      console.error('Error comparing marketplace prices:', handleApiError(error));
      return null;
    }
  },

  /**
   * Get best deals - books with largest price differences
   */
  async getBestDeals(limit: number = 10): Promise<any> {
    try {
      const { data } = await apiClient.get<ApiResponse<any>>('/api/pricing/best-deals', {
        params: { limit }
      });
      return data.data || null;
    } catch (error) {
      console.error('Error fetching best deals:', handleApiError(error));
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
  },

  // ===== Phase 1: New Methods =====

  /**
   * Calculate checkout total with stacked discounts
   * Combines Decorator Pattern + Strategy Pattern
   * Used in checkout process
   */
  async calculateCheckout(request: CheckoutCalculationRequest): Promise<CheckoutResponse | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<CheckoutResponse>>('/api/discount/calculate-checkout', request);
      return data.data || null;
    } catch (error) {
      console.error('Error calculating checkout:', handleApiError(error));
      return null;
    }
  },

  /**
   * Apply and validate coupon code
   */
  async applyCoupon(code: string, price: number): Promise<CouponApplyResponse | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<CouponApplyResponse>>('/api/discount/apply-coupon', {
        code,
        price
      });
      return data.data || null;
    } catch (error) {
      const errorMsg = handleApiError(error);
      console.error('Error applying coupon:', errorMsg);
      // Return error response instead of null for better UX
      return {
        valid: false,
        discount: 0,
        finalPrice: price,
        message: errorMsg
      };
    }
  },

  /**
   * Black Friday sale calculation (example promotional endpoint)
   */
  async blackFriday(items: BlackFridayRequest['items']): Promise<BlackFridayResponse | null> {
    try {
      const { data } = await apiClient.post<ApiResponse<BlackFridayResponse>>('/api/discount/black-friday', {
        items
      });
      return data.data || null;
    } catch (error) {
      console.error('Error calculating Black Friday discount:', handleApiError(error));
      return null;
    }
  }
};