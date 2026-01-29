// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// Error response
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Pricing & Discount types (cho Design Patterns)
export interface PricingRequest {
  basePrice: number;
  quantity: number;
  strategy: 'regular' | 'member' | 'wholesale' | 'vip';
  productName?: string;
}

export interface PricingResponse {
  originalTotal: number;
  finalPrice: number;
  savings: number;
  savingsPercentage: number;
  strategy: {
    name: string;
    description: string;
  };
}

export interface DiscountRequest {
  basePrice: number;
  quantity: number;
  itemName: string;
  discounts: Array<{
    type: 'coupon' | 'percentage' | 'fixed' | 'membership' | 'bulk' | 'seasonal';
    value: number;
    reason?: string;
  }>;
}

export interface DiscountResponse {
  originalPrice: number;
  finalPrice: number;
  totalDiscount: number;
  discountPercentage: number;
  description: string;
  appliedDiscounts: string[];
}

// ===== Phase 1: New Types for API Integration =====

// Checkout Calculation (Discount API)
export interface CheckoutCalculationRequest {
  userId: string;
  items: CheckoutItem[];
  couponCode?: string;
}

export interface CheckoutItem {
  bookId: string;
  quantity: number;
  basePrice: number;
}

export interface CheckoutResponse {
  subtotal: number;
  membershipDiscount: number;
  couponDiscount: number;
  seasonalDiscount: number;
  total: number;
  discountsApplied: string[];
}

// Coupon Application (Discount API)
export interface CouponApplyRequest {
  code: string;
  price: number;
}

export interface CouponApplyResponse {
  valid: boolean;
  discount: number;
  finalPrice: number;
  message: string;
}

// Black Friday Sale (Discount API)
export interface BlackFridayRequest {
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface BlackFridayResponse {
  originalTotal: number;
  finalTotal: number;
  totalSavings: number;
  savingsPercentage: number;
  message: string;
}
