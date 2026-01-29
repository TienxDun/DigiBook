import { pricingApi, discountApi } from '@/services/api';
import { CartItem } from '@/shared/types';

interface DiscountBreakdown {
  type: string;
  amount: number;
  reason: string;
}

interface PricingResult {
  subtotal: number;
  shipping: number;
  discounts: DiscountBreakdown[];
  total: number;
  originalTotal: number;
}

const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * Calculate pricing with Design Patterns (Strategy + Decorator)
 * Falls back to simple calculation if API not enabled
 */
export async function calculatePricingWithPatterns(
  cart: CartItem[],
  userId: string | undefined,
  couponData?: { code: string; discountValue: number; discountType: string } | null,
  membershipTier?: string
): Promise<PricingResult> {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500000 ? 0 : 25000;
  const discounts: DiscountBreakdown[] = [];

  // If API mode is disabled or no user, use simple calculation
  if (!USE_API || !userId) {
    // Simple coupon discount (no API)
    let couponDiscount = 0;
    if (couponData) {
      if (couponData.discountType === 'percentage') {
        couponDiscount = (subtotal * couponData.discountValue) / 100;
      } else {
        couponDiscount = couponData.discountValue;
      }
    }

    return {
      subtotal,
      shipping,
      discounts: couponDiscount > 0 ? [{ type: 'coupon', amount: couponDiscount, reason: `Mã ${couponData?.code}` }] : [],
      total: subtotal + shipping - couponDiscount,
      originalTotal: subtotal + shipping
    };
  }

  try {
    // 1. Calculate base price with Pricing Strategy Pattern
    let finalPrice = subtotal;
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Call pricing API if membership exists
    if (membershipTier && membershipTier !== 'regular') {
      // Backend expects basePrice per item, not subtotal
      // So we send average price per item for Strategy Pattern calculation
      const avgPricePerItem = totalQuantity > 0 ? subtotal / totalQuantity : subtotal;
      
      const pricingResult = await pricingApi.calculateForUser(userId, avgPricePerItem, totalQuantity);
      
      if (pricingResult && pricingResult.finalPrice > 0) {
        const membershipDiscount = subtotal - pricingResult.finalPrice;
        if (membershipDiscount > 0) {
          discounts.push({
            type: 'membership',
            amount: membershipDiscount,
            reason: `Ưu đãi ${pricingResult.strategy.name}`
          });
          finalPrice = pricingResult.finalPrice;
        }
      }
    }

    // 2. Apply stacked discounts with Decorator Pattern
    const discountRequest = {
      basePrice: finalPrice,
      quantity: totalQuantity,
      itemName: 'Đơn hàng',
      discounts: [] as any[]
    };

    // Add coupon discount with actual values
    if (couponData) {
      discountRequest.discounts.push({
        type: 'coupon',
        value: couponData.discountValue,
        reason: `Mã ${couponData.code}`
      });
    }

    // Add seasonal discount (example)
    const today = new Date();
    if (today.getMonth() === 0 || today.getMonth() === 1) { // Jan-Feb
      discountRequest.discounts.push({
        type: 'seasonal',
        value: 5, // 5%
        reason: 'Khuyến mãi Tết'
      });
    }

    // Call discount API if we have any discounts to apply
    if (discountRequest.discounts.length > 0) {
      const discountResult = await discountApi.calculate(discountRequest);
      if (discountResult) {
        // Add discounts from Decorator Pattern API result
        // Note: discountResult already includes all stacked discounts
        const decoratorDiscount = finalPrice - discountResult.finalPrice;
        
        if (decoratorDiscount > 0) {
          // Parse applied discounts from description or use breakdown
          if (couponData) {
            // Calculate actual coupon discount applied
            const discountVal = couponData.discountValue;
            const discountTyp = couponData.discountType;
            
            const couponAmount = discountTyp === 'percentage'
              ? (finalPrice * discountVal) / 100
              : discountVal;
            
            discounts.push({
              type: 'coupon',
              amount: couponAmount,
              reason: `Mã ${couponData.code}`
            });
          }
          
          // Add seasonal discount if it was in the request
          if (today.getMonth() === 0 || today.getMonth() === 1) {
            const seasonalAmount = (finalPrice * 5) / 100;
            discounts.push({
              type: 'seasonal',
              amount: seasonalAmount,
              reason: 'Khuyến mãi Tết'
            });
          }
        }
        
        finalPrice = discountResult.finalPrice;
      }
    }

    const total = finalPrice + shipping;
    const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);

    return {
      subtotal,
      shipping,
      discounts,
      total,
      originalTotal: subtotal + shipping
    };
  } catch (error) {
    console.error('Error calculating pricing with patterns:', error);
    // Fallback to simple calculation
    return {
      subtotal,
      shipping,
      discounts: [],
      total: subtotal + shipping,
      originalTotal: subtotal + shipping
    };
  }
}
