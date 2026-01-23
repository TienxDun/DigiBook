import { useContext } from 'react';
import { ToastContext } from './ToastContext';

/**
 * Custom hook để sử dụng Toast System
 * 
 * @example
 * ```tsx
 * const toast = useToast();
 * 
 * // Success toast
 * toast.success('Thành công', 'Đã thêm sách vào giỏ hàng');
 * 
 * // Error toast
 * toast.error('Lỗi', 'Không thể xóa sản phẩm');
 * 
 * // Info toast
 * toast.info('Thông tin', 'Bạn có 3 sản phẩm trong giỏ hàng');
 * 
 * // Warning toast
 * toast.warning('Cảnh báo', 'Sản phẩm sắp hết hàng');
 * 
 * // Custom duration (ms)
 * toast.success('Đã lưu', undefined, 2000);
 * ```
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  
  return context;
};
