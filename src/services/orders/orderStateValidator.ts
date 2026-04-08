
/**
 * @file orderStateValidator.ts
 * @description Frontend implementation of the State Design Pattern for orders.
 * This enforces business rules for order status transitions.
 */

export const ORDER_STATUS = {
  PENDING: 'Đang xử lý',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  FAILED: 'Giao thất bại',
  CANCELED: 'Đã hủy'
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PACKING, ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.PACKING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.DELIVERED]: [], // Final state
  [ORDER_STATUS.CANCELED]: [],  // Final state
  [ORDER_STATUS.FAILED]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELED], // Can retry shipping
};

/**
 * Validates if an order can transition from current status to new status.
 * @returns { success: boolean; message?: string }
 */
export const canTransitionTo = (currentStatus: string, nextStatus: string): { success: boolean; message?: string } => {
  // 1. Same status is always okay (no-op)
  if (currentStatus === nextStatus) return { success: true };

  // 2. Check if the transition exists in our rules
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  
  if (allowed.includes(nextStatus)) {
    return { success: true };
  }

  // 3. Special rule: Admin might need to cancel from almost anywhere 
  // (already handled by VALID_TRANSITIONS but emphasized here)
  
  return { 
    success: false, 
    message: `Không thể chuyển trạng thái từ "${currentStatus}" sang "${nextStatus}" theo quy định nghiệp vụ.` 
  };
};
